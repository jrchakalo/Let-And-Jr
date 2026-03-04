import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isBackofficeAuthenticated } from "@/lib/admin-auth";

function unauth() {
  return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
}

// POST /api/admin/guests/[id]/attend
// Body: { attended: boolean }
// Marks or unmarks a guest as attended on event day.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isBackofficeAuthenticated())) return unauth();
  const { id } = await params;
  const { attended } = (await req.json()) as { attended: boolean };

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("guests")
    .update({
      attended,
      attended_at: attended ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
