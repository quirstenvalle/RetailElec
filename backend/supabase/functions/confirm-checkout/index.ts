import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function todayLabel() {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  }).format(new Date());
}

async function getPaymongoSecret() {
  const fromEnv = Deno.env.get("PAYMONGO_SECRET_KEY") || "";
  if (fromEnv.startsWith("sk_")) return fromEnv;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data } = await admin
    .from("app_secrets")
    .select("value")
    .eq("key", "PAYMONGO_SECRET_KEY")
    .maybeSingle();

  return data?.value?.startsWith("sk_") ? data.value : "";
}

async function isPaymongoPaid(checkoutId: string, secretKey: string) {
  const auth = btoa(`${secretKey}:`);
  const endpoints = [
    `https://api.paymongo.com/v2/checkout_sessions/${checkoutId}`,
    `https://api.paymongo.com/v1/checkout_sessions/${checkoutId}`,
  ];

  for (const url of endpoints) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) continue;
    const payload = await response.json();
    const attributes = payload?.data?.attributes || {};
    const payments = attributes.payments || attributes.payment_intent?.attributes?.payments || [];
    if (
      Array.isArray(payments) &&
      payments.some((p: { attributes?: { status?: string } }) => p?.attributes?.status === "paid")
    ) {
      return {
        paid: true,
        paymentId:
          payments.find(
            (p: { attributes?: { status?: string }; id?: string }) =>
              p?.attributes?.status === "paid",
          )?.id || null,
      };
    }
    if (attributes.status === "paid" || attributes.payment_status === "paid") {
      return { paid: true, paymentId: null };
    }
  }

  return { paid: false, paymentId: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const referenceNumber = String(body.referenceNumber || "").trim();
    if (!referenceNumber) return json({ error: "referenceNumber is required" }, 400);

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("reference_number", referenceNumber)
      .eq("user_id", user.id)
      .maybeSingle();

    if (paymentError) return json({ error: paymentError.message }, 400);
    if (!payment) return json({ error: "Payment not found" }, 404);

    if (payment.status === "paid" && payment.order_id) {
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("*")
        .eq("id", payment.order_id)
        .maybeSingle();
      return json({
        ok: true,
        alreadyPaid: true,
        order: {
          id: existingOrder?.receipt_id,
          total: Number(existingOrder?.total || payment.amount),
          items: payment.cart_snapshot,
          deliveryMode: existingOrder?.delivery_mode || payment.delivery_mode,
          paymentMode: "online",
          orderDate: existingOrder?.order_date,
          orderNumber: existingOrder?.order_number,
          paymentStatus: "paid",
        },
        payment,
      });
    }

    const secretKey = await getPaymongoSecret();
    let paymongoPaymentId = payment.paymongo_payment_id;

    if (payment.mode === "paymongo") {
      if (!payment.paymongo_checkout_id || !secretKey) {
        return json({ error: "PayMongo is not configured for this payment" }, 400);
      }
      const result = await isPaymongoPaid(payment.paymongo_checkout_id, secretKey);
      if (!result.paid) {
        return json({ error: "Payment is not completed yet", awaiting: true }, 402);
      }
      paymongoPaymentId = result.paymentId;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("email", profile?.email)
      .maybeSingle();

    const { data: orderNumber, error: numberError } = await supabase.rpc("next_order_number");
    if (numberError) return json({ error: numberError.message }, 400);

    const receiptId = `#LMN-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderDate = todayLabel();
    const items = payment.cart_snapshot as Array<Record<string, unknown>>;
    const shipping = (payment.shipping_snapshot || {}) as Record<string, string>;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        receipt_id: receiptId,
        customer_id: customer?.id ?? null,
        customer_name: profile?.name || user.email,
        customer_email: profile?.email || user.email,
        status: "Pending",
        delivery_mode: payment.delivery_mode,
        payment_mode: "online",
        payment_status: "paid",
        paymongo_checkout_id: payment.paymongo_checkout_id,
        paymongo_payment_id: paymongoPaymentId,
        paid_at: new Date().toISOString(),
        total: payment.amount,
        order_date: orderDate,
        shipping_address:
          payment.delivery_mode === "courier"
            ? String(shipping.deliveryAddress || "").trim() || null
            : null,
        shipping_city:
          payment.delivery_mode === "courier"
            ? String(shipping.deliveryCity || "").trim() || null
            : null,
        shipping_province:
          payment.delivery_mode === "courier"
            ? String(shipping.deliveryProvince || "").trim() || null
            : null,
        shipping_postal_code:
          payment.delivery_mode === "courier"
            ? String(shipping.deliveryPostalCode || "").trim() || null
            : null,
      })
      .select("*")
      .single();

    if (orderError) return json({ error: orderError.message }, 400);

    const itemsPayload = items.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      name: item.name,
      category: item.category,
      display_category: item.displayCategory,
      unit_price: item.unitPrice,
      piece_price: item.piecePrice,
      pack_price: item.packPrice || 0,
      pricing_unit:
        item.pricingUnit === "piece"
          ? "piece"
          : item.pricingUnit === "pack"
            ? "pack"
            : "box",
      pack_label: item.packLabel,
      unit_weight: item.unitWeight,
      image_path: item.image,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(itemsPayload);
    if (itemsError) return json({ error: itemsError.message }, 400);

    const { error: stockError } = await supabase.rpc("decrement_stock_for_order", {
      p_order_id: order.id,
    });
    if (stockError) return json({ error: stockError.message || "Could not update stock" }, 400);

    if (customer?.id) {
      await supabase
        .from("customers")
        .update({ last_transaction: orderDate })
        .eq("id", customer.id);
    }

    await supabase.from("cart_items").delete().eq("user_id", user.id);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await admin.rpc("notify_user", {
      p_user_id: user.id,
      p_title: "Payment received",
      p_body: `Your online payment for ${orderNumber} was successful.`,
      p_type: "payment",
      p_link: `/orders?order=${orderNumber}`,
    });
    await admin.rpc("notify_admins", {
      p_title: "New paid order",
      p_body: `${profile?.name || user.email} paid for ${orderNumber}.`,
      p_type: "payment",
      p_link: "/admin/orders",
    });

    const { data: updatedPayment, error: updateError } = await supabase
      .from("payments")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        order_id: order.id,
        paymongo_payment_id: paymongoPaymentId,
      })
      .eq("id", payment.id)
      .select("*")
      .single();

    if (updateError) return json({ error: updateError.message }, 400);

    return json({
      ok: true,
      order: {
        id: receiptId,
        total: Number(order.total),
        items,
        deliveryMode: order.delivery_mode,
        paymentMode: "online",
        orderDate,
        orderNumber,
        paymentStatus: "paid",
      },
      payment: updatedPayment,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
