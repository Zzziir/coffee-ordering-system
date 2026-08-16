import { supabaseAdmin } from "./supabase/admin";
import { listCustomerOrders } from "./store";
import { getMenu } from "./menu-store";
import { drinkStickers, STAMPS_PER_REWARD } from "./menu";

/**
 * Loyalty — "10 stamps, 1 free drink", derived, never stored as a balance.
 *
 * A signed-in customer's standing is a pure function of three facts:
 *   seed        stamps carried over from guest ordering, banked at sign-up
 *   drinks      one stamp per drink on their paid orders (food earns nothing)
 *   redeemed    free drinks a reward was spent on (sum of reward_qty)
 *
 * A redeemed drink earns no stamp, and each redemption spends one whole card.
 *
 * Two events, not one: a reward is *reserved* the moment it's applied to an
 * order (so it can't be spent twice), but its stamps are only *earned* when that
 * order is paid — cash settles at pickup. So the two sides of the ledger read
 * reward_qty from different sets of orders:
 *
 *   progress / earned  ← paid orders only, so committing a future redemption
 *                         never makes the visible progress dip.
 *   free available     ← all orders, so a reserved reward is gone immediately
 *                         and can't be redeemed again before it's picked up.
 *
 * Recomputing from these facts means the balance can never drift the way a
 * mutable counter would.
 */

export type LoyaltyState = {
  /** Net lifetime stamps — what the card fills against. */
  stamps: number;
  /** 0..9 progress on the current card (stamps that haven't formed a reward). */
  progress: number;
  /** Free drinks the customer can redeem right now. */
  free: number;
};

export async function getLoyalty(customerId: string): Promise<LoyaltyState> {
  const [{ data: profile }, orders, menu] = await Promise.all([
    supabaseAdmin()
      .from("profiles")
      .select("loyalty_seed")
      .eq("id", customerId)
      .maybeSingle<{ loyalty_seed: number }>(),
    listCustomerOrders(customerId),
    getMenu(),
  ]);

  const seed = profile?.loyalty_seed ?? 0;
  const paidOrders = orders.filter((o) => o.paid);
  const purchasedDrinks = paidOrders.reduce(
    (total, o) => total + drinkStickers(menu, o.items),
    0,
  );
  // Redemptions on paid orders adjust the earned tally (the comped drink earns
  // nothing); redemptions on every order — paid or not — reduce what's still
  // spendable, so a reward reserved on an unpaid order can't be used twice.
  const paidRedeemed = paidOrders.reduce((total, o) => total + o.rewardQty, 0);
  const committedRedeemed = orders.reduce((total, o) => total + o.rewardQty, 0);

  const stamps = Math.max(0, seed + purchasedDrinks - paidRedeemed);
  const earnedRewards = Math.floor(stamps / STAMPS_PER_REWARD);

  return {
    stamps,
    progress: stamps % STAMPS_PER_REWARD,
    free: Math.max(0, earnedRewards - committedRedeemed),
  };
}
