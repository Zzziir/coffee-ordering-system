import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * Supabase client for the browser, reading the same session cookies the server
 * writes. Used for Realtime subscriptions on the staff queue — signing in and
 * out happen in Server Actions, which can set cookies properly.
 */
export function createBrowserSupabase() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
