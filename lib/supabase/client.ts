import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Browser-side client (uses anon key — row-level security applies)
export function createBrowserClient(): SupabaseClient | null {
  if (typeof window === "undefined") {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn(
      "Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
    return null;
  }

  return createClient(url, anonKey);
}
