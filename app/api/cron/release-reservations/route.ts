import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET /api/cron/release-reservations
// Called by Vercel Cron (configure in vercel.json) to release stale reservations.
// Requires Authorization: Bearer <CRON_SECRET> header.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (process.env.CRON_SECRET && auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("gifts")
    .update({ status: "AVAILABLE", reserved_by_name: null, reserved_at: null })
    .eq("status", "RESERVED")
    .gt("units_remaining", 0)
    .lt("reserved_at", cutoff)
    .select("id, name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    released: data?.length ?? 0,
    gifts: data?.map((g: { id: string; name: string }) => g.name),
  });
}
