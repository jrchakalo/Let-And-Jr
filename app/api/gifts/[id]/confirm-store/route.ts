import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// POST /api/gifts/[id]/confirm-store
// Called when the user confirms they completed the purchase at the external store.
// Changes status from RESERVED → PAID.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: gift } = await supabase
    .from("gifts")
    .select("status, reserved_by_name, price, units_remaining")
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
  const nextStatus = nextRemaining <= 0 ? "PAID" : "AVAILABLE";

  const { data, error } = await supabase
    .from("gifts")
    .update({
      status: nextStatus,
      units_remaining: nextRemaining,
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
    contributor_name: gift.reserved_by_name ?? "Não informado",
    contributor_email: null,
    contribution_type: "STORE_CONFIRM",
    quantity: 1,
    amount: gift.price ?? null,
    status: "CONFIRMED",
  });

  return NextResponse.json(data);
}
