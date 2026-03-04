import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

// GET /c/[code] → redirect to /presenca/[magic_token]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = createServerClient();

  const { data: family } = await supabase
    .from("families")
    .select("magic_token")
    .eq("short_code", code.toLowerCase())
    .single();

  if (!family?.magic_token) {
    redirect("/");
  }

  redirect(`/presenca/${family.magic_token}`);
}
