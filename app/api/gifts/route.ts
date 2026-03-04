import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET /api/gifts — list all gifts, release stale reservations on the fly
export async function GET() {
  const supabase = createServerClient();

  // Release reservations older than 24 hours
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("gifts")
    .update({ status: "AVAILABLE", reserved_by_name: null, reserved_at: null })
    .eq("status", "RESERVED")
    .lt("reserved_at", cutoff);

  const { data, error } = await supabase
    .from("gifts")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
