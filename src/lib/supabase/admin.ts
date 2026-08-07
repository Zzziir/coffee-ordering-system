import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

/**
 * SERVER ONLY. This client uses the service role key and bypasses row level
 * security entirely.
 *
 * It exists because a customer is anonymous: they hold only their own order id,
 * and RLS cannot express "the one row you asked for" (see the note at the foot
 * of supabase/migrations/0001_multi_branch.sql). So placing and reading an order
 * goes through server routes on this client, which enforce the scope in app
 * code instead.
 *
 * Never import this from a client component.
 */
let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Copy .env.example to .env.local and fill it in.",
    );
  }

  cached = createClient(SUPABASE_URL, key, {
    // No browser, no cookies, no session to keep — every call is a fresh
    // server-side request already authorised by the key itself.
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
