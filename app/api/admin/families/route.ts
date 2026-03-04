import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAdminAuthenticated, isBackofficeAuthenticated } from "@/lib/admin-auth";

function unauth() {
  return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
}

// GET /api/admin/families — list all families with their guests
export async function GET() {
  if (!(await isBackofficeAuthenticated())) return unauth();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("families")
    .select("*, guests(*)")
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/admin/families — create a new family
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return unauth();
  const supabase = createServerClient();
  const { name } = (await req.json()) as { name: string };
  if (!name?.trim())
    return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 });
  const { data, error } = await supabase
    .from("families")
    .insert({ name: name.trim() })
    .select("*, guests(*)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
