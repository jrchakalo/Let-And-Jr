import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function unauth() {
  return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
}

function isMissingCotaValueColumnError(error: { message?: string } | null) {
  return Boolean(error?.message?.includes("cota_value"));
}

// PUT /api/admin/gifts/[id] — update gift
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) return unauth();
  const { id } = await params;
  const body = (await req.json()) as {
    name?: string;
    price?: number;
    image_url?: string;
    store_url?: string;
    is_cota?: boolean;
    cota_value?: number;
    status?: string;
  };
  const updates: Record<string, unknown> = {};
  if (body.name?.trim()) updates.name = body.name.trim();
  if (body.price !== undefined) updates.price = Number(body.price);
  if (body.image_url !== undefined) updates.image_url = body.image_url || null;
  if (body.store_url !== undefined) updates.store_url = body.store_url || null;
  if (body.is_cota !== undefined) {
    updates.is_cota = body.is_cota;
    if (body.is_cota && body.cota_value !== undefined) {
      updates.cota_value = Number(body.cota_value);
    }
  }
  if (body.status) updates.status = body.status;
  const supabase = createServerClient();
  let { data, error } = await supabase
    .from("gifts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error && isMissingCotaValueColumnError(error)) {
    delete updates.cota_value;
    const retry = await supabase
      .from("gifts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/admin/gifts/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) return unauth();
  const { id } = await params;
  const supabase = createServerClient();
  const { error } = await supabase.from("gifts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
