import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET /api/rsvp/[token] — resolve token → family + guests
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createServerClient();

  const { data: family, error } = await supabase
    .from("families")
    .select("*, guests(*)")
    .eq("magic_token", token)
    .single();

  if (error || !family) {
    return NextResponse.json({ error: "Token inválido." }, { status: 404 });
  }

  return NextResponse.json(family);
}

// POST /api/rsvp/[token] — update individual guest rsvp_status
// Body: { guestId: string; status: "CONFIRMED" | "DECLINED" }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createServerClient();

  // Verify token
  const { data: family, error: famErr } = await supabase
    .from("families")
    .select("id")
    .eq("magic_token", token)
    .single();

  if (famErr || !family) {
    return NextResponse.json({ error: "Token inválido." }, { status: 403 });
  }

  const body = await req.json();
  const { guestId, status } = body as {
    guestId: string;
    status: "CONFIRMED" | "DECLINED";
  };

  if (!guestId || !["CONFIRMED", "DECLINED"].includes(status)) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  // Update only guests that belong to this family
  const { data, error } = await supabase
    .from("guests")
    .update({ rsvp_status: status })
    .eq("id", guestId)
    .eq("family_id", family.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Convidado não encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
