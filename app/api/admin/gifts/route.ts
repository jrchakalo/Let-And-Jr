import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function unauth() {
  return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
}

function isMissingCotaValueColumnError(error: { message?: string } | null) {
  return Boolean(error?.message?.includes("cota_value"));
}

// GET /api/admin/gifts — list all gifts with buyer info
export async function GET() {
  if (!(await isAdminAuthenticated())) return unauth();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("gifts")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/admin/gifts — create a new gift
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return unauth();
  const supabase = createServerClient();
  const body = (await req.json()) as {
    name: string;
    price: number;
    image_url?: string;
    store_url?: string;
    is_cota?: boolean;
    cota_value?: number;
    units_total?: number;
  };
  if (!body.name?.trim())
    return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 });
  const payload: Record<string, unknown> = {
    name: body.name.trim(),
    price: Number(body.price) || 0,
    image_url: body.image_url || null,
    store_url: body.store_url || null,
    is_cota: body.is_cota ?? false,
  };

  const requestedUnits = Number.isFinite(body.units_total)
    ? Math.floor(Number(body.units_total))
    : 1;
  const unitsTotal = Math.max(1, requestedUnits);
  payload.units_total = unitsTotal;
  payload.units_remaining = unitsTotal;

  if (body.is_cota && body.cota_value !== undefined) {
    payload.cota_value = Number(body.cota_value);
  }

  let { data, error } = await supabase
    .from("gifts")
    .insert(payload)
    .select()
    .single();

  if (error && isMissingCotaValueColumnError(error)) {
    delete payload.cota_value;
    const retry = await supabase.from("gifts").insert(payload).select().single();
    data = retry.data;
    error = retry.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
