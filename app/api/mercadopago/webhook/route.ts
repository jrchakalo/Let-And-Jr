import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createServerClient } from "@/lib/supabase/server";

// POST /api/mercadopago/webhook
// Receives IPN/webhook notifications from Mercado Pago and marks gifts as PAID.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as Record<string, unknown>));

  const queryType =
    req.nextUrl.searchParams.get("type") ??
    req.nextUrl.searchParams.get("topic") ??
    "";
  const queryPaymentId =
    req.nextUrl.searchParams.get("data.id") ?? req.nextUrl.searchParams.get("id");

  const bodyType =
    (typeof body.type === "string" && body.type) ||
    (typeof body.topic === "string" && body.topic) ||
    (typeof body.action === "string" && body.action) ||
    "";

  const bodyPaymentId =
    typeof body.data === "object" && body.data !== null && "id" in body.data
      ? String((body.data as { id?: string | number }).id ?? "")
      : typeof body.id === "string" || typeof body.id === "number"
      ? String(body.id)
      : null;

  const eventType = (bodyType || queryType).toLowerCase();
  const paymentId = bodyPaymentId || queryPaymentId;

  if (!eventType.includes("payment") || !paymentId) {
    return NextResponse.json({ received: true });
  }

  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    console.error("[MP webhook] MERCADOPAGO_ACCESS_TOKEN não configurado.");
    return NextResponse.json({ received: true });
  }

  const mp = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  });

  try {
    const payment = new Payment(mp);
    const paymentData = await payment.get({ id: paymentId });

    if (paymentData.status === "approved") {
      const ref = paymentData.external_reference;
      if (ref) {
        const supabase = createServerClient();

        // Check if this is a cota payment: "giftId|cota|qty"
        const parts = ref.split("|");
        const giftId = parts[0];
        const isCota = parts[1] === "cota";
        const cotaQty = isCota ? parseInt(parts[2] ?? "1", 10) : 0;

        if (isCota && cotaQty > 0) {
          // Fetch current gift to compute new total
          const { data: gift } = await supabase
            .from("gifts")
            .select("cotas_paid, price, cota_value")
            .eq("id", giftId)
            .single();

          if (gift && gift.cota_value) {
            const newPaid = (gift.cotas_paid ?? 0) + cotaQty;
            const totalCotas = Math.ceil(gift.price / gift.cota_value);
            const nowComplete = newPaid >= totalCotas;
            await supabase
              .from("gifts")
              .update({
                cotas_paid: newPaid,
                reserved_by_name: paymentData.payer?.first_name ?? "Anônimo",
                ...(nowComplete ? { status: "PAID" } : {}),
              })
              .eq("id", giftId);

            await supabase.from("gift_contributions").upsert(
              {
                gift_id: giftId,
                contributor_name:
                  [paymentData.payer?.first_name, paymentData.payer?.last_name]
                    .filter(Boolean)
                    .join(" ") || "Anônimo",
                contributor_email: paymentData.payer?.email ?? null,
                contribution_type: "MERCADOPAGO_COTA",
                quantity: cotaQty,
                amount: paymentData.transaction_amount
                  ? Number(paymentData.transaction_amount)
                  : Number(gift.cota_value) * cotaQty,
                status: "CONFIRMED",
                mercadopago_payment_id: String(paymentData.id),
              },
              { onConflict: "mercadopago_payment_id" }
            );
          }
        } else {
          // Regular gift: mark fully paid
          await supabase
            .from("gifts")
            .update({
              status: "PAID",
              reserved_by_name: paymentData.payer?.first_name ?? "Anônimo",
            })
            .eq("id", giftId)
            .in("status", ["AVAILABLE", "RESERVED"]); // idempotent

          await supabase.from("gift_contributions").upsert(
            {
              gift_id: giftId,
              contributor_name:
                [paymentData.payer?.first_name, paymentData.payer?.last_name]
                  .filter(Boolean)
                  .join(" ") || "Anônimo",
              contributor_email: paymentData.payer?.email ?? null,
              contribution_type: "MERCADOPAGO_GIFT",
              quantity: 1,
              amount: paymentData.transaction_amount
                ? Number(paymentData.transaction_amount)
                : null,
              status: "CONFIRMED",
              mercadopago_payment_id: String(paymentData.id),
            },
            { onConflict: "mercadopago_payment_id" }
          );
        }
      }
    }
  } catch (error) {
    console.error("[MP webhook] erro ao processar pagamento", {
      paymentId,
      error,
    });
  }

  return NextResponse.json({ received: true });
}
