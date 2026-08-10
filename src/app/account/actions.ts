"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCustomer } from "@/lib/customer";

/**
 * Customer sign up, sign in, sign out and profile edits.
 *
 * As with the staff actions, these run on the server so the session cookie is
 * written by the same request that authenticates — the browser never holds a
 * token the server hasn't seen.
 */

export type AuthState = { error: string } | null;

/** Land a `?next=` hop only if it stays inside the account area. */
function safeNext(next: string | null): string {
  return next && next.startsWith("/account") ? next : "/account";
}

export async function signIn(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Deliberately vague, so we don't reveal which emails have accounts.
    return { error: "That email and password don't match." };
  }

  // Authenticating proves who they are, not that they're a customer.
  const customer = await getCustomer();
  if (!customer) {
    await supabase.auth.signOut();
    return { error: "That account isn't set up as a Craffe customer." };
  }

  redirect(safeNext(String(formData.get("next") ?? "") || null));
}

export async function signUp(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const ageRaw = String(formData.get("age") ?? "").trim();
  const favoriteFlavor = String(formData.get("favoriteFlavor") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!firstName || !lastName) {
    return { error: "Please tell us your first and last name." };
  }
  if (!email) {
    return { error: "An email is required." };
  }
  if (password.length < 8) {
    return { error: "Use a password of at least 8 characters." };
  }
  const age = ageRaw ? Number(ageRaw) : null;
  if (age !== null && (!Number.isInteger(age) || age < 13 || age > 120)) {
    return { error: "Please enter a valid age." };
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // These land in raw_user_meta_data, where the on_auth_user_created trigger
      // reads them to build the profile row (see 0004_customer_accounts.sql).
      data: {
        first_name: firstName,
        last_name: lastName,
        age: age === null ? "" : String(age),
        favorite_flavor: favoriteFlavor,
        phone,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // With email confirmation off, signUp returns a session and the customer is in.
  // With it on, there's no session yet — send them to sign in once confirmed.
  if (!data.session) {
    redirect("/account/sign-in?check=1");
  }

  redirect("/account");
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/account/sign-in");
}

export async function updateProfile(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const customer = await getCustomer();
  if (!customer) redirect("/account/sign-in");

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const ageRaw = String(formData.get("age") ?? "").trim();
  const favoriteFlavor = String(formData.get("favoriteFlavor") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!firstName || !lastName) {
    return { error: "Please keep your first and last name filled in." };
  }
  const age = ageRaw ? Number(ageRaw) : null;
  if (age !== null && (!Number.isInteger(age) || age < 13 || age > 120)) {
    return { error: "Please enter a valid age." };
  }

  const supabase = await createServerSupabase();
  // RLS lets a customer update only their own row (profiles_update_self).
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      age,
      favorite_flavor: favoriteFlavor || null,
      phone: phone || null,
    })
    .eq("id", customer.id);

  if (error) {
    return { error: "Could not save your changes. Please try again." };
  }

  redirect("/account");
}
