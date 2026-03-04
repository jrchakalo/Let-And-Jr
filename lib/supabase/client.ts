import { createClient } from "@supabase/supabase-js";

// Browser-side client (uses anon key — row-level security applies)
export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
