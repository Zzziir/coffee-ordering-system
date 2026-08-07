import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * A Supabase client bound to the caller's session cookies, for Server
 * Components, route handlers and Server Actions.
 *
 * It runs as whoever is signed in, so row level security applies — a barista
 * reading `orders` through this client sees only their own branch. Work that
 * must bypass RLS (writing an anonymous customer's order) uses ./admin instead.
 *
 * Build a new client per request; never share one across requests.
 */
export async function createServerSupabase() {
  const store = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) {
            store.set(name, value, options);
          }
        } catch {
          // Server Components are not allowed to write cookies. proxy.ts
          // refreshes the session on every /staff request and can write there,
          // so a refreshed token is never lost — only re-derived.
        }
      },
    },
  });
}
