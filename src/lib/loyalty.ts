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
 *   redemptions orders that comped a free drink (reward_discount > 0)
 *
 * The comped drink itself earns no stamp, so each redemption removes one from
 * the drink tally and spends one whole card. Recomputing from these facts means
 * the balance can never drift the way a mutable counter would (see 0008).
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
  const purchasedDrinks = orders
    .filter((o) => o.paid)
    .reduce((total, o) => total + drinkStickers(menu, o.items), 0);
  const redemptions = orders.filter((o) => o.rewardDiscount > 0).length;

  // Comped drinks earn nothing, hence the subtraction of one per redemption.
  const stamps = Math.max(0, seed + purchasedDrinks - redemptions);
  const earnedRewards = Math.floor(stamps / STAMPS_PER_REWARD);

  return {
    stamps,
    progress: stamps % STAMPS_PER_REWARD,
    free: Math.max(0, earnedRewards - redemptions),
  };
}
