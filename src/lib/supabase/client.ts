import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Only publishable credentials belong in the browser. Authorization is enforced by RLS.
let instance: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  if (!instance) instance = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return instance;
}
