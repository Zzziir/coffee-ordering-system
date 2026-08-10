import { createServerSupabase } from "./supabase/server";

/**
 * The person on the other side of the counter — a guest who signed up so their
 * orders and their loyalty stickers follow them.
 *
 * Like staff (see ./staff), the `profiles` table is the identity and Supabase
 * Auth is only the credential. An account can be authenticated and still have no
 * profile — a staff login, say — so every check here fails closed.
 */

export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  age: number | null;
  favoriteFlavor: string | null;
  phone: string | null;
  email: string;
};

/** The signed-in customer, or null if nobody is signed in as one. */
export async function getCustomer(): Promise<Customer | null> {
  const supabase = await createServerSupabase();

  // getUser revalidates the JWT with Supabase rather than trusting the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, age, favorite_flavor, phone, email")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;

  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    age: data.age,
    favoriteFlavor: data.favorite_flavor,
    phone: data.phone,
    email: data.email,
  };
}
