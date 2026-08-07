"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getStaffMember, safeLandingPath } from "@/lib/staff";

/**
 * Sign in and out happen here rather than in the browser: a Server Action can
 * write the session cookie itself, so there is no window where the client holds
 * a token the server hasn't seen.
 */

export type SignInState = { error: string } | null;

export async function signIn(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Deliberately vague: distinguishing "no such account" from "wrong
    // password" tells an attacker which emails are real.
    return { error: "That email and password don't match." };
  }

  // Authenticating proves who they are, not that they work here.
  const staff = await getStaffMember();
  if (!staff) {
    await supabase.auth.signOut();
    return { error: "That account isn't set up for a Craffé branch." };
  }

  redirect(safeLandingPath(staff, String(formData.get("next") ?? "") || null));
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/staff/sign-in");
}
