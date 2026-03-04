import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function unauth() {
  return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
}

// POST /api/admin/families/[id]/guests — add guest to family
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) return unauth();
  const { id: familyId } = await params;
  const { name } = (await req.json()) as { name: string };
  if (!name?.trim())
    return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 });
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("guests")
    .insert({ family_id: familyId, name: name.trim() })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
