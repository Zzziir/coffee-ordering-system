"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

/**
 * Who is signed in, as far as the site nav needs to know: are they a customer,
 * and are they an admin (an owner or manager on the staff roster)?
 *
 * Reads straight from Supabase under row level security — a signed-in user may
 * read only their own `profiles` and `staff` rows — so no extra endpoint is
 * needed. Re-runs on every auth change so the nav updates the moment they sign
 * in or out.
 */
export type AccountNav = {
  loading: boolean;
  isCustomer: boolean;
  isAdmin: boolean;
  firstName: string | null;
};

const SIGNED_OUT: AccountNav = {
  loading: false,
  isCustomer: false,
  isAdmin: false,
  firstName: null,
};

export function useAccountNav(): AccountNav {
  const [state, setState] = useState<AccountNav>({ ...SIGNED_OUT, loading: true });

  useEffect(() => {
    const supabase = createBrowserSupabase();
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setState(SIGNED_OUT);
        return;
      }

      const [{ data: profile }, { data: staff }] = await Promise.all([
        supabase.from("profiles").select("first_name").eq("id", user.id).maybeSingle(),
        supabase.from("staff").select("role").eq("id", user.id).maybeSingle(),
      ]);
      if (!active) return;

      setState({
        loading: false,
        isCustomer: !!profile,
        isAdmin: staff?.role === "owner" || staff?.role === "manager",
        firstName: profile?.first_name ?? null,
      });
    }

    load();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => load());

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
