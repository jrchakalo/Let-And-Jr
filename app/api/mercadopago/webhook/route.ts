import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, MerchantOrder, Payment } from "mercadopago";
import { createServerClient } from "@/lib/supabase/server";
import { createHmac, timingSafeEqual } from "node:crypto";

function parseSignatureHeader(signatureHeader: string) {
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const values = new Map<string, string>();

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key && value) values.set(key, value);
  }

  return {
    ts: values.get("ts") ?? null,
    v1: values.get("v1") ?? null,
  };
}

function secureEquals(a: string, b: string) {
  const aBuffer = Buffer.from(a, "utf8");
  const bBuffer = Buffer.from(b, "utf8");
  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

function isValidMercadoPagoSignature(req: NextRequest) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[MP webhook] MERCADOPAGO_WEBHOOK_SECRET não configurado.");
    return false;
  }

  const signatureHeader = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
  const dataIdFromData = req.nextUrl.searchParams.get("data.id");
  const dataIdFromId = req.nextUrl.searchParams.get("id");
  const dataId = dataIdFromData ?? dataIdFromId;

  if (!signatureHeader || !dataId) {
    console.warn("[MP webhook] assinatura ausente/incompleta", {
      hasSignature: Boolean(signatureHeader),
      hasRequestId: Boolean(requestId),
      hasDataId: Boolean(dataId),
    });
    return false;
  }

  const { ts, v1 } = parseSignatureHeader(signatureHeader);
  if (!ts || !v1) return false;

  const candidates = new Set<string>();
  if (dataIdFromData) {
    candidates.add(dataIdFromData);
    candidates.add(dataIdFromData.toLowerCase());
  }
  if (dataIdFromId) {
    candidates.add(dataIdFromId);
    candidates.add(dataIdFromId.toLowerCase());
  }

  for (const candidate of candidates) {
    const manifests = requestId
      ? [
          `id:${candidate};request-id:${requestId};ts:${ts};`,
          `id:${candidate};ts:${ts};`,
        ]
      : [`id:${candidate};ts:${ts};`];

    for (const manifest of manifests) {
      const expectedV1 = createHmac("sha256", secret)
        .update(manifest)
        .digest("hex");

      if (secureEquals(expectedV1, v1)) {
        return true;
      }
    }
  }

  console.warn("[MP webhook] assinatura inválida", {
    hasDataDotId: Boolean(dataIdFromData),
    hasId: Boolean(dataIdFromId),
  });
  return false;
}

async function persistApprovedPayment(paymentData: Awaited<ReturnType<Payment["get"]>>) {
  const ref = paymentData.external_reference;
  if (!ref) return;

  const mercadopagoPaymentId =
    paymentData.id !== undefined && paymentData.id !== null
      ? String(paymentData.id)
      : null;
  if (!mercadopagoPaymentId) return;

  const supabase = createServerClient();

  const metadata =
    paymentData.metadata && typeof paymentData.metadata === "object"
      ? (paymentData.metadata as Record<string, unknown>)
      : {};
  const metadataPayerName =
    typeof metadata.payer_name === "string" ? metadata.payer_name.trim() : "";
  const metadataPayerEmail =
    typeof metadata.payer_email === "string" ? metadata.payer_email.trim() : null;
  const contributorName =
    [paymentData.payer?.first_name, paymentData.payer?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || metadataPayerName || "Anônimo";
  const contributorEmail = paymentData.payer?.email ?? metadataPayerEmail ?? null;

  const parts = ref.split("|");
  const giftId = parts[0];
  const isCota = parts[1] === "cota";
  const cotaQty = isCota ? parseInt(parts[2] ?? "1", 10) : 0;

  async function ensureContribution(payload: {
    gift_id: string;
    contributor_name: string;
    contributor_email: string | null;
    contribution_type:
      | "MERCADOPAGO_GIFT"
      | "MERCADOPAGO_COTA"
      | "MANUAL_CLAIM"
      | "STORE_CONFIRM"
      | "MANUAL_COTA";
    quantity: number;
    amount: number | null;
    status: "CONFIRMED";
    mercadopago_payment_id: string;
  }) {
    const insertRes = await supabase.from("gift_contributions").insert(payload).select("id").maybeSingle();

    if (!insertRes.error && insertRes.data) {
      return true;
    }

    if (insertRes.error) {
      const uniqueConflict =
        insertRes.error.code === "23505" ||
        insertRes.error.message.toLowerCase().includes("duplicate");

      if (!uniqueConflict) {
        console.error("[MP webhook] erro ao inserir contribuição", {
          mercadopagoPaymentId,
          giftId,
          error: insertRes.error,
        });
        return false;
      }
    }

    const { data: existingContribution } = await supabase
      .from("gift_contributions")
      .select("id")
      .eq("mercadopago_payment_id", mercadopagoPaymentId)
      .maybeSingle();

    return Boolean(existingContribution);
  }

  async function reconcileRegularGift() {
    await supabase
      .from("gifts")
      .update({
        status: "PAID",
        reserved_by_name: contributorName,
      })
      .eq("id", giftId)
      .in("status", ["AVAILABLE", "RESERVED", "PAID"]);

    console.info("[MP webhook] presente reconciliado", {
      mercadopagoPaymentId,
      giftId,
    });
  }

  async function reconcileCotaGift() {
    const { data: gift } = await supabase
      .from("gifts")
      .select("price, cota_value")
      .eq("id", giftId)
      .single();

    if (!gift?.cota_value) return;

    const { data: contributions } = await supabase
      .from("gift_contributions")
      .select("quantity")
      .eq("gift_id", giftId)
      .in("contribution_type", ["MERCADOPAGO_COTA", "MANUAL_COTA"]);

    const totalPaid = (contributions ?? []).reduce(
      (sum, contribution) => sum + (contribution.quantity ?? 0),
      0
    );
    const totalCotas = Math.ceil(gift.price / gift.cota_value);
    const nowComplete = totalPaid >= totalCotas;

    await supabase
      .from("gifts")
      .update({
        cotas_paid: totalPaid,
        reserved_by_name: contributorName,
        ...(nowComplete ? { status: "PAID" } : {}),
      })
      .eq("id", giftId);

    console.info("[MP webhook] cota reconciliada", {
      mercadopagoPaymentId,
      giftId,
      totalPaid,
      nowComplete,
    });
  }

  const { data: existing } = await supabase
    .from("gift_contributions")
    .select("id")
    .eq("mercadopago_payment_id", mercadopagoPaymentId)
    .maybeSingle();

  if (existing) {
    console.info("[MP webhook] pagamento já processado", {
      mercadopagoPaymentId,
    });

    if (isCota) {
      await reconcileCotaGift();
    } else {
      await reconcileRegularGift();
    }

    return;
  }

  if (isCota && cotaQty > 0) {
    const { data: gift } = await supabase
      .from("gifts")
      .select("price, cota_value")
      .eq("id", giftId)
      .single();

    if (gift && gift.cota_value) {
      const contributionPersisted = await ensureContribution({
        gift_id: giftId,
        contributor_name: contributorName,
        contributor_email: contributorEmail,
        contribution_type: "MERCADOPAGO_COTA",
        quantity: cotaQty,
        amount: paymentData.transaction_amount
          ? Number(paymentData.transaction_amount)
          : Number(gift.cota_value) * cotaQty,
        status: "CONFIRMED",
        mercadopago_payment_id: mercadopagoPaymentId,
      });

      if (!contributionPersisted) {
        console.warn("[MP webhook] falha ao persistir contribuição cota", {
          mercadopagoPaymentId,
          giftId,
        });
      }

      await reconcileCotaGift();

      console.info("[MP webhook] cota processada", {
        mercadopagoPaymentId,
        giftId,
        cotaQty,
      });
    }

    return;
  }

  const contributionPersisted = await ensureContribution({
    gift_id: giftId,
    contributor_name: contributorName,
    contributor_email: contributorEmail,
    contribution_type: "MERCADOPAGO_GIFT",
    quantity: 1,
    amount: paymentData.transaction_amount
      ? Number(paymentData.transaction_amount)
      : null,
    status: "CONFIRMED",
    mercadopago_payment_id: mercadopagoPaymentId,
  });

  if (!contributionPersisted) {
    console.warn("[MP webhook] falha ao persistir contribuição presente", {
      mercadopagoPaymentId,
      giftId,
    });
  }

  await reconcileRegularGift();

  console.info("[MP webhook] presente processado", {
    mercadopagoPaymentId,
    giftId,
  });
}

async function processMercadoPagoNotification(
  req: NextRequest,
  body: Record<string, unknown>
) {
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

  if (!paymentId) {
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
    if (eventType.includes("merchant_order")) {
      const merchantOrder = new MerchantOrder(mp);
      const orderData = await merchantOrder.get({
        merchantOrderId: Number(paymentId),
      });

      const approvedPaymentIds = (orderData.payments ?? [])
        .filter((p) => p.status === "approved" && p.id)
        .map((p) => String(p.id));

      for (const approvedPaymentId of approvedPaymentIds) {
        const paymentData = await payment.get({ id: approvedPaymentId });
        if (paymentData.status === "approved") {
          await persistApprovedPayment(paymentData);
        }
      }

      return NextResponse.json({ received: true });
    }

    if (eventType.includes("payment")) {
      const paymentData = await payment.get({ id: paymentId });
      if (paymentData.status === "approved") {
        await persistApprovedPayment(paymentData);
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

// POST /api/mercadopago/webhook
// Receives IPN/webhook notifications from Mercado Pago and marks gifts as PAID.
export async function POST(req: NextRequest) {
  if (!isValidMercadoPagoSignature(req)) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  return processMercadoPagoNotification(req, body);
}

export async function GET(req: NextRequest) {
  return processMercadoPagoNotification(req, {});
}
