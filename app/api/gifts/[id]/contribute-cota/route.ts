import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// POST /api/gifts/[id]/contribute-cota
// Body: { name: string; quantity: number }
// Increments cotas_paid by `quantity`. Marks PAID when fully funded.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, quantity } = (await req.json()) as {
    name: string;
    quantity: number;
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 });
  }
  if (!quantity || quantity < 1 || !Number.isInteger(quantity)) {
    return NextResponse.json(
      { error: "Quantidade de cotas inválida." },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  const { data: gift, error: fetchErr } = await supabase
    .from("gifts")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !gift) {
    return NextResponse.json(
      { error: "Presente não encontrado." },
      { status: 404 }
    );
  }

  if (!gift.is_cota || !gift.cota_value) {
    return NextResponse.json(
      { error: "Este presente não é uma cota." },
      { status: 400 }
    );
  }

  if (gift.status === "PAID") {
    return NextResponse.json(
      { error: "Este presente já foi completamente financiado." },
      { status: 409 }
    );
  }

  const totalCotas = Math.ceil(gift.price / gift.cota_value);
  const remaining = totalCotas - (gift.cotas_paid ?? 0);

  if (quantity > remaining) {
    return NextResponse.json(
      {
        error: `Apenas ${remaining} cota${remaining === 1 ? "" : "s"} disponível${remaining === 1 ? "" : "is"}.`,
      },
      { status: 409 }
    );
  }

  const newCotasPaid = (gift.cotas_paid ?? 0) + quantity;
  const nowComplete = newCotasPaid >= totalCotas;

  const updates: Record<string, unknown> = {
    cotas_paid: newCotasPaid,
    reserved_by_name: name.trim(),
    reserved_at: new Date().toISOString(),
  };
  if (nowComplete) {
    updates.status = "CLAIMED_MANUALLY";
  }

  const { data: updated, error: updateErr } = await supabase
    .from("gifts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  await supabase.from("gift_contributions").insert({
    gift_id: id,
    contributor_name: name.trim(),
    contributor_email: null,
    contribution_type: "MANUAL_COTA",
    quantity,
    amount: Number(gift.cota_value) * quantity,
    status: "CONFIRMED",
  });

  return NextResponse.json(updated);
}
