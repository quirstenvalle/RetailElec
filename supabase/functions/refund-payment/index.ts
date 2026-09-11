import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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
    const orderNumber = String(body.orderNumber || "").trim();
    const amount = Number(body.amount || 0);
    const paymentId = String(body.paymentId || "").trim();

    if (!orderNumber) return json({ error: "orderNumber is required" }, 400);
    if (!Number.isFinite(amount) || amount <= 0) return json({ error: "refund amount must be greater than zero" }, 400);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, payment_mode, payment_status, paymongo_payment_id, total")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (orderError) return json({ error: orderError.message }, 400);
    if (!order) return json({ error: "Order not found" }, 404);

    const paymentMode = String(order.payment_mode || "").toLowerCase();
    const paymongoPaymentId = paymentId || String(order.paymongo_payment_id || "").trim();

    if (paymentMode !== "online" && !paymongoPaymentId) {
      return json({ ok: true, mode: "manual", message: "No online payment refund required for this order." });
    }

    const secretKey = await getPaymongoSecret();
    if (!secretKey || !paymongoPaymentId) {
      return json({ ok: true, mode: "manual", message: "Refund recorded. PayMongo secret or payment id is missing, so no automatic gateway refund was sent." });
    }

    const auth = btoa(`${secretKey}:`);
    const response = await fetch(`https://api.paymongo.com/v1/payments/${paymongoPaymentId}/refunds`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: Math.max(0, Math.round(amount * 100)),
            reason: "requested_by_customer",
            note: `Refund for order ${orderNumber}`,
          },
        },
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      return json(
        {
          error: result?.errors?.[0]?.detail || result?.error?.message || "PayMongo refund failed",
          gateway: "paymongo",
        },
        400,
      );
    }

    return json({
      ok: true,
      mode: "paymongo",
      refund: result,
      gateway: "paymongo",
      amount,
      paymentId: paymongoPaymentId,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
