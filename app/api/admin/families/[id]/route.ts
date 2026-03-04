import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function unauth() {
  return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
}

// PUT /api/admin/families/[id] — rename family
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) return unauth();
  const { id } = await params;
  const { name } = (await req.json()) as { name: string };
  if (!name?.trim())
    return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 });
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("families")
    .update({ name: name.trim() })
    .eq("id", id)
    .select("*, guests(*)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/admin/families/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) return unauth();
  const { id } = await params;
  const supabase = createServerClient();
  const { error } = await supabase.from("families").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
