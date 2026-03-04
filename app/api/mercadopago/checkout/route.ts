import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createServerClient } from "@/lib/supabase/server";

function parseMpError(error: unknown): {
  status: number;
  message: string;
  details?: string;
} {
  const fallback = {
    status: 500,
    message: "Erro ao iniciar o checkout. Tente novamente.",
  };

  if (!error || typeof error !== "object") return fallback;

  const maybe = error as {
    message?: string;
    status?: number;
    cause?: { message?: string; status?: number; code?: string };
  };

  const status =
    typeof maybe.status === "number"
      ? maybe.status
      : typeof maybe.cause?.status === "number"
      ? maybe.cause.status
      : 500;

  const code = maybe.cause?.code;
  const rawMessage =
    maybe.cause?.message || maybe.message || "Erro ao iniciar o checkout.";

  if (status === 403 || code === "PA_UNAUTHORIZED_RESULT_FROM_POLICIES") {
    return {
      status: 403,
      message:
        "Mercado Pago bloqueou esta operação (403). Verifique o ACCESS_TOKEN, permissões da conta e se o ambiente (teste/produção) está correto.",
      details: rawMessage,
    };
  }

  return {
    status,
    message: "Erro ao iniciar o checkout no Mercado Pago.",
    details: rawMessage,
  };
}

// POST /api/mercadopago/checkout
// Body: { giftId: string; payerName: string; payerEmail: string; cotaQuantity?: number }
// Creates a Mercado Pago preference and returns the checkout URL.
// For cota gifts, cotaQuantity determines how many quotas are being paid.
export async function POST(req: NextRequest) {
  try {
    const { giftId, payerName, payerEmail, cotaQuantity } = (await req.json()) as {
      giftId: string;
      payerName: string;
      payerEmail: string;
      cotaQuantity?: number;
    };

    if (!giftId || !payerName?.trim() || !payerEmail?.trim()) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "MERCADOPAGO_ACCESS_TOKEN não configurado." },
        { status: 500 }
      );
    }

    const supabase = createServerClient();

    const { data: gift, error } = await supabase
      .from("gifts")
      .select("*")
      .eq("id", giftId)
      .single();

    if (error || !gift) {
      return NextResponse.json({ error: "Presente não encontrado." }, { status: 404 });
    }

    if (gift.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Este presente já foi reservado ou comprado." },
        { status: 409 }
      );
    }

    // For cota gifts, validate quantity and compute price
    let itemQuantity = 1;
    let unitPrice = Number(gift.price);

    if (gift.is_cota && gift.cota_value) {
      const qty = cotaQuantity && cotaQuantity >= 1 ? Math.floor(cotaQuantity) : 1;
      const totalCotas = Math.ceil(gift.price / gift.cota_value);
      const remaining = totalCotas - (gift.cotas_paid ?? 0);
      if (qty > remaining) {
        return NextResponse.json(
          { error: `Apenas ${remaining} cota${remaining === 1 ? "" : "s"} disponível${remaining === 1 ? "" : "is"}.` },
          { status: 409 }
        );
      }
      itemQuantity = qty;
      unitPrice = Number(gift.cota_value);
    }

    const mp = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim() || req.nextUrl.origin;

    const preference = new Preference(mp);

    const response = await preference.create({
      body: {
        items: [
          {
            id: gift.id,
            title: gift.is_cota
              ? `${gift.name} — ${itemQuantity} cota${itemQuantity > 1 ? "s" : ""}`
              : gift.name,
            quantity: itemQuantity,
            unit_price: unitPrice,
            currency_id: "BRL",
          },
        ],
        payer: {
          name: payerName.trim(),
          email: payerEmail.trim(),
        },
        back_urls: {
          success: `${baseUrl}/presentes?status=success&gift=${giftId}`,
          failure: `${baseUrl}/presentes?status=failure&gift=${giftId}`,
          pending: `${baseUrl}/presentes?status=pending&gift=${giftId}`,
        },
        auto_return: "approved",
        notification_url: `${baseUrl}/api/mercadopago/webhook`,
        external_reference: gift.is_cota ? `${giftId}|cota|${itemQuantity}` : giftId,
        statement_descriptor: "LETICIA E JUNIOR",
      },
    });

    return NextResponse.json({
      checkoutUrl: response.init_point,
      preferenceId: response.id,
    });
  } catch (error) {
    const parsed = parseMpError(error);
    return NextResponse.json(
      { error: parsed.message, details: parsed.details },
      { status: parsed.status }
    );
  }
}
