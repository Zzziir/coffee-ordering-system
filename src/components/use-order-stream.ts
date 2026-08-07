"use client";

import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { BranchId, Order } from "@/lib/types";
import { createBrowserSupabase } from "@/lib/supabase/browser";

/** What this subscriber is watching — one branch's queue, or one order. */
export type StreamTarget = { branch: BranchId } | { order: string };

/**
 * Subscribe to live order changes. Calls `onOrder` for each change to whatever
 * `target` names.
 *
 * Two targets, two transports, because the two audiences are not alike:
 *
 *   { branch } — a barista, signed in. Listens to `postgres_changes` on the
 *                orders table; row level security scopes the feed to branches
 *                they may work at, so the filter is the database's job.
 *
 *   { order }  — a customer, anonymous, holding only their own order id.
 *                Listens to a broadcast topic named after that order. There is
 *                deliberately no anon read policy on `orders` to enumerate, and
 *                knowing the uuid is the credential — the same unguessable-link
 *                model this page already relies on.
 *
 * Neither payload carries customer data. Realtime only says "this order moved";
 * the order itself is read back through the server route, which is what decides
 * what the viewer may see.
 */
export function useOrderStream(target: StreamTarget, onOrder: (order: Order) => void) {
  const cb = useRef(onOrder);
  cb.current = onOrder;

  // Split into primitives so the effect doesn't re-run on a fresh object.
  const branch = "branch" in target ? target.branch : null;
  const orderId = "order" in target ? target.order : null;

  useEffect(() => {
    const supabase = createBrowserSupabase();
    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    const pull = async (id: string) => {
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (!res.ok || cancelled) return;
        const { order } = await res.json();
        cb.current(order as Order);
      } catch {
        /* a dropped fetch just means this change is missed; the next one wins */
      }
    };

    (async () => {
      if (branch) {
        // postgres_changes is filtered by RLS, which needs the staff token —
        // set it before subscribing or the first frames arrive unauthenticated.
        const { data } = await supabase.auth.getSession();
        if (data.session) await supabase.realtime.setAuth(data.session.access_token);
      }
      if (cancelled) return;

      channel = branch
        ? supabase.channel(`staff:${branch}`).on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "orders",
              filter: `branch_id=eq.${branch}`,
            },
            (payload) => {
              const id = (payload.new as { id?: string })?.id;
              if (id) pull(id);
            },
          )
        : supabase.channel(`order:${orderId}`).on(
            "broadcast",
            { event: "change" },
            (message) => {
              const id = (message.payload as { id?: string })?.id;
              if (id) pull(id);
            },
          );

      channel.subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [branch, orderId]);
}
