"use server";

import { getCustomer } from "./customer";
import { supabaseAdmin } from "./supabase/admin";

/**
 * Record that we've celebrated the customer's reward count up to `count`, so a
 * completed card cheers exactly once per account. Only ever raises the mark
 * (or sets it from null), never lowers it, so two tabs can't undo each other.
 * Identity is the session, never the argument.
 */
export async function ackRewardCelebration(count: number): Promise<void> {
  const customer = await getCustomer();
  if (!customer) return;

  const next = Math.max(0, Math.trunc(Number(count) || 0));
  await supabaseAdmin()
    .from("profiles")
    .update({ rewards_celebrated: next })
    .eq("id", customer.id)
    .or(`rewards_celebrated.is.null,rewards_celebrated.lt.${next}`);
}
