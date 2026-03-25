import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// POST /api/gifts/[id]/reserve
// Body: { name: string }
// Marks gift as RESERVED for a store purchase. Returns the updated gift.
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

  // Fetch the gift first
  const { data: gift, error: fetchErr } = await supabase
    .from("gifts")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !gift) {
    return NextResponse.json({ error: "Presente não encontrado." }, { status: 404 });
  }

  if ((gift.units_remaining ?? 1) <= 0) {
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

  const shouldBlockCompletely = (gift.units_remaining ?? 1) === 1;

  const { data, error } = await supabase
    .from("gifts")
    .update({
      status: shouldBlockCompletely ? "RESERVED" : "AVAILABLE",
      reserved_by_name: name.trim(),
      reserved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
