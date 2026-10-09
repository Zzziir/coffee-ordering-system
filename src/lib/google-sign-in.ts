import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabase } from "./supabase/server";

/**
 * "Continue with Google", for both kinds of account. Google only proves who
 * someone is; which door they came through decides what the callback checks
 * them against (the `profiles` table or the `staff` roster).
 */

export type GoogleAudience = "customer" | "staff";

export const GOOGLE_SIGN_IN_PAGE: Record<GoogleAudience, string> = {
  customer: "/account/sign-in",
  staff: "/staff/sign-in",
};

/**
 * Send the visitor to Google's consent screen. They come back through
 * /auth/callback, which finishes the sign-in and resolves `next`.
 *
 * Call this from a Server Action: starting on the server keeps the PKCE
 * verifier in a cookie this server set, so the callback can trade the code for
 * a session.
 */
export async function redirectToGoogle(
  audience: GoogleAudience,
  next: string | null,
): Promise<never> {
  const origin = (await headers()).get("origin");
  if (!origin) throw new Error("Sign-in request arrived without an Origin header.");

  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("audience", audience);
  if (next) callback.searchParams.set("next", next);

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() },
  });
  if (error) redirect(`${GOOGLE_SIGN_IN_PAGE[audience]}?error=google`);

  redirect(data.url);
}
