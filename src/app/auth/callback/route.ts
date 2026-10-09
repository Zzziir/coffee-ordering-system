import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getCustomer, safeNext } from "@/lib/customer";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Where Google hands a customer back after "Continue with Google" (see
 * signInWithGoogle in app/account/actions.ts).
 *
 * Supabase returns a one-time `code`; trading it for a session here, on the
 * server, writes the session cookie in the same response, the same way the
 * password sign-in does.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const code = searchParams.get("code");
  if (!code) redirect("/account/sign-in?error=google");

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) redirect("/account/sign-in?error=google");

  // Authenticating proves who they are, not that they're a customer. A first
  // Google sign-in gets its profile from the on_auth_user_created trigger; a
  // staff login that happens to share the Google email has none.
  const customer = await getCustomer();
  if (!customer) {
    await supabase.auth.signOut();
    redirect("/account/sign-in?error=not-customer");
  }

  redirect(safeNext(searchParams.get("next")));
}
