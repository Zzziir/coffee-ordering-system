import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getCustomer, safeNext } from "@/lib/customer";
import { GOOGLE_SIGN_IN_PAGE, type GoogleAudience } from "@/lib/google-sign-in";
import { getStaffMember, safeLandingPath } from "@/lib/staff";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Where Google hands someone back after "Continue with Google" (see
 * redirectToGoogle in lib/google-sign-in.ts).
 *
 * Supabase returns a one-time `code`; trading it for a session here, on the
 * server, writes the session cookie in the same response, the same way the
 * password sign-ins do.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const audience: GoogleAudience =
    searchParams.get("audience") === "staff" ? "staff" : "customer";
  const signInPage = GOOGLE_SIGN_IN_PAGE[audience];

  const code = searchParams.get("code");
  if (!code) redirect(`${signInPage}?error=google`);

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) redirect(`${signInPage}?error=google`);

  // Authenticating proves who they are, not that they belong behind this door.
  // A Google account that isn't on the roster (or has no profile) is signed
  // straight back out.
  const landing = await landingFor(audience, searchParams.get("next"));
  if (!landing) {
    await supabase.auth.signOut();
    redirect(`${signInPage}?error=not-${audience}`);
  }

  redirect(landing);
}

/** Where this person lands, or null if they aren't who the door is for. */
async function landingFor(
  audience: GoogleAudience,
  next: string | null,
): Promise<string | null> {
  if (audience === "staff") {
    const staff = await getStaffMember();
    return staff && safeLandingPath(staff, next);
  }

  // A first Google sign-in gets its profile from the on_auth_user_created
  // trigger (0012_google_sign_in.sql).
  const customer = await getCustomer();
  return customer && safeNext(next);
}
