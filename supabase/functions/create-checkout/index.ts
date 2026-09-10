import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const COURIER_DELIVERY_FEE = 30;
const VOLUME_DISCOUNT_RATE = 0.06;
const ONLINE_DISCOUNT_RATE = 0.005;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function originalUnitPrice(
  product: Record<string, unknown>,
  pricingUnit: string,
) {
  const unitPrice = Number(product.unit_price) || 0;
  if (pricingUnit === "piece") return Number(product.piece_price ?? unitPrice) || 0;
  if (pricingUnit === "pack") return Number(product.pack_price ?? unitPrice) || 0;
  return unitPrice;
}

function saleUnitPrice(product: Record<string, unknown>, pricingUnit: string) {
  const original = originalUnitPrice(product, pricingUnit);
  const discountPercent = Number(product.deal_discount) || 0;
  const onSale =
    Boolean(product.is_deal || product.is_featured) || discountPercent > 0;
  if (!onSale || discountPercent <= 0 || !original) return original;
  return Number((original * (1 - Math.min(Math.max(discountPercent, 0), 100) / 100)).toFixed(2));
}

function computeTotals(
  lines: Array<{ unit_price: number; quantity: number }>,
  deliveryMode: string,
  voucherDiscount = 0,
) {
  const subtotal = lines.reduce(
    (sum, line) => sum + Number(line.unit_price) * Number(line.quantity),
    0,
  );
  const volumeDiscount = subtotal > 0 ? Math.round(subtotal * VOLUME_DISCOUNT_RATE) : 0;
  const shipping = deliveryMode === "courier" && subtotal > 0 ? COURIER_DELIVERY_FEE : 0;
  const onlineDiscount = subtotal > 0 ? Math.round(subtotal * ONLINE_DISCOUNT_RATE) : 0;
  const total = Math.max(
    0,
    subtotal + shipping - volumeDiscount - onlineDiscount - voucherDiscount,
  );
  return { subtotal, volumeDiscount, shipping, onlineDiscount, total };
}

function paymongoLineItems(totals: { total: number; shipping: number }) {
  const totalCentavos = Math.max(0, Math.round(Number(totals.total) * 100));
  const shippingCentavos = Math.max(0, Math.round(Number(totals.shipping) * 100));
  const itemsCentavos = Math.max(0, totalCentavos - shippingCentavos);
  const lines: Array<Record<string, string | number>> = [];

  if (itemsCentavos > 0) {
    lines.push({
      name: "Order items",
      description: "Merchandise after discounts",
      quantity: 1,
      amount: itemsCentavos,
      currency: "PHP",
    });
  }

  if (shippingCentavos > 0) {
    lines.push({
      name: "Delivery fee",
      description: "Courier delivery",
      quantity: 1,
      amount: shippingCentavos,
      currency: "PHP",
    });
  }

  if (!lines.length) {
    lines.push({
      name: "Wholesale Purchase Order",
      quantity: 1,
      amount: totalCentavos,
      currency: "PHP",
    });
  }

  return { lineItems: lines, totalCentavos, shippingCentavos };
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
    const deliveryMode = body.deliveryMode === "pickup" ? "pickup" : "courier";
    const returnOrigin = String(body.returnOrigin || "").replace(/\/$/, "");
    if (!returnOrigin) return json({ error: "returnOrigin is required" }, 400);
    const shippingAddress = body.shippingAddress || {};
    const voucherDiscount = Math.max(0, Number(body.voucherDiscount) || 0);

    if (deliveryMode === "courier" && !String(shippingAddress.deliveryAddress || "").trim()) {
      return json({ error: "Delivery address is required for courier delivery" }, 400);
    }

    const { data: cartRows, error: cartError } = await supabase
      .from("cart_items")
      .select("product_id, quantity, pricing_unit")
      .eq("user_id", user.id);

    if (cartError) return json({ error: cartError.message }, 400);
    if (!cartRows?.length) return json({ error: "Cart is empty" }, 400);

    const productIds = cartRows.map((row) => row.product_id);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds);

    if (productsError) return json({ error: productsError.message }, 400);

    const cartSnapshot = cartRows.map((row) => {
      const product = products?.find((item) => item.id === row.product_id);
      if (!product) throw new Error(`Product missing: ${row.product_id}`);

      const pricingUnit =
        row.pricing_unit === "piece"
          ? "piece"
          : row.pricing_unit === "pack"
            ? "pack"
            : "box";

      const unitPrice = Number(product.unit_price) || 0;
      const piecePrice = Number(product.piece_price) || 0;
      const packPrice = Number(product.pack_price) || 0;
      const chargedPrice = saleUnitPrice(product, pricingUnit);

      return {
        id: product.id,
        name: product.name,
        category: product.category,
        displayCategory: product.display_category,
        unitPrice,
        piecePrice,
        packPrice,
        pricingUnit,
        packLabel: product.pack_label,
        unitWeight: product.unit_weight,
        image: product.image_path,
        quantity: Number(row.quantity),
        chargedPrice,
      };
    });

    const totals = computeTotals(
      cartSnapshot.map((item) => ({
        unit_price: item.chargedPrice,
        quantity: item.quantity,
      })),
      deliveryMode,
      voucherDiscount,
    );

    if (body.expectedTotal != null && body.expectedTotal !== "") {
      const expectedTotal = Number(body.expectedTotal);
      if (Number.isFinite(expectedTotal) && Math.abs(expectedTotal - totals.total) > 0.05) {
        return json(
          {
            error: `PayMongo total ₱${totals.total.toFixed(2)} does not match cart total ₱${expectedTotal.toFixed(2)}.`,
            expectedTotal,
            paymongoTotal: totals.total,
            shipping: totals.shipping,
          },
          400,
        );
      }
    }

    const referenceNumber = `PAY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const secretKey = await getPaymongoSecret();
    const mode = secretKey.startsWith("sk_") ? "paymongo" : "demo";

    let checkoutUrl = `${returnOrigin}/payment/demo?ref=${encodeURIComponent(referenceNumber)}`;
    let paymongoCheckoutId: string | null = null;

    if (mode === "paymongo") {
      const { lineItems } = paymongoLineItems(totals);
      const payload = {
        data: {
          attributes: {
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            description: `Quinto Store wholesale order ${referenceNumber}`,
            line_items: lineItems,
            payment_method_types: ["card", "gcash", "paymaya", "grab_pay", "qrph"],
            success_url: `${returnOrigin}/payment/callback?ref=${encodeURIComponent(referenceNumber)}`,
            cancel_url: `${returnOrigin}/cart`,
            reference_number: referenceNumber,
            metadata: {
              user_id: user.id,
              reference_number: referenceNumber,
              delivery_mode: deliveryMode,
              delivery_fee: String(totals.shipping),
              amount: String(totals.total),
            },
          },
        },
      };

      const auth = btoa(`${secretKey}:`);
      const pmResponse = await fetch("https://api.paymongo.com/v2/checkout_sessions", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const pmJson = await pmResponse.json();
      if (!pmResponse.ok) {
        return json(
          {
            error:
              pmJson?.errors?.[0]?.detail ||
              pmJson?.error?.message ||
              "PayMongo checkout failed",
          },
          400,
        );
      }

      paymongoCheckoutId = pmJson.data.id;
      checkoutUrl = pmJson.data.attributes.checkout_url;
    }

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        status: "awaiting_payment",
        mode,
        amount: totals.total,
        currency: "PHP",
        delivery_mode: deliveryMode,
        payment_mode: "online",
        cart_snapshot: cartSnapshot,
        shipping_snapshot: {
          ...(deliveryMode === "courier" ? shippingAddress : {}),
          deliveryFee: totals.shipping,
          deliveryMode,
        },
        paymongo_checkout_id: paymongoCheckoutId,
        checkout_url: checkoutUrl,
        reference_number: referenceNumber,
      })
      .select("*")
      .single();

    if (paymentError) return json({ error: paymentError.message }, 400);

    return json({
      ok: true,
      mode,
      checkoutUrl,
      referenceNumber,
      paymentId: payment.id,
      total: totals.total,
      shipping: totals.shipping,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
