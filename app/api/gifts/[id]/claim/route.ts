import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// POST /api/gifts/[id]/claim
// Body: { name: string }
// Marks gift as CLAIMED_MANUALLY (bought offline / physical delivery).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  const { name } = (await req.json()) as { name: string };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
  }

  const { data: gift } = await supabase
    .from("gifts")
    .select("status, units_remaining")
    .eq("id", id)
    .single();

  if (!gift) {
    return NextResponse.json({ error: "Presente não encontrado." }, { status: 404 });
  }

  if (!gift.units_remaining || gift.units_remaining <= 0) {
    return NextResponse.json(
      { error: "Este presente não possui mais unidades disponíveis." },
      { status: 409 }
    );
  }

  if (gift.status === "PAID" || gift.status === "CLAIMED_MANUALLY") {
    return NextResponse.json(
      { error: "Este presente já foi finalizado." },
      { status: 409 }
    );
  }

  const nextRemaining = Math.max(0, gift.units_remaining - 1);
  const nextStatus = nextRemaining <= 0 ? "CLAIMED_MANUALLY" : "AVAILABLE";

  const { data, error } = await supabase
    .from("gifts")
    .update({
      status: nextStatus,
      units_remaining: nextRemaining,
      reserved_by_name: name.trim(),
      reserved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("gift_contributions").insert({
    gift_id: id,
    contributor_name: name.trim(),
    contributor_email: null,
    contribution_type: "MANUAL_CLAIM",
    quantity: 1,
    amount: data?.price ?? null,
    status: "CONFIRMED",
  });

  return NextResponse.json(data);
}
