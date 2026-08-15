"use client";

import { useEffect } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

const STAMP_KEY = "craffe.stamps";

/**
 * Carries the stamps a guest earned on this device into their account the moment
 * they have one, then clears the local tally so it is never counted twice.
 *
 * It fires both for a session already signed in on load and for a sign-in that
 * happens later in the same session (the checkout "save your progress" prompt),
 * which is why it watches auth changes rather than only reading once. A guest
 * with no session keeps their tally untouched for a future account.
 */
export function LoyaltyMigrator() {
  useEffect(() => {
    const supabase = createBrowserSupabase();

    const migrate = async (signedIn: boolean) => {
      if (!signedIn) return;
      let stamps = 0;
      try {
        stamps = Number(localStorage.getItem(STAMP_KEY) || "0");
      } catch {
        return;
      }
      if (!stamps) return;

      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stamps }),
      });
      if (res.ok) {
        try {
          localStorage.removeItem(STAMP_KEY);
        } catch {
          /* private mode — the tally will just migrate again next time */
        }
      }
    };

    supabase.auth.getUser().then(({ data }) => migrate(Boolean(data.user)));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      migrate(Boolean(session?.user)),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return null;
}
