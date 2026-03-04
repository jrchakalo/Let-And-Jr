import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function unauth() {
  return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
}

// GET /api/admin/contributions — list all gift contributions with gift names
export async function GET() {
  if (!(await isAdminAuthenticated())) return unauth();

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("gift_contributions")
    .select("*, gift:gifts(id, name, status)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
