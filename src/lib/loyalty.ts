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
 *   redeemed    free drinks taken across all orders (sum of reward_qty)
 *
 * An order can redeem several free drinks at once (see 0009). Each comped drink
 * earns no stamp, so it removes one from the drink tally and spends one whole
 * card. Recomputing from these facts means the balance can never drift the way
 * a mutable counter would.
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
  const redeemed = orders.reduce((total, o) => total + o.rewardQty, 0);

  // Comped drinks earn nothing, hence the subtraction of one per free drink.
  const stamps = Math.max(0, seed + purchasedDrinks - redeemed);
  const earnedRewards = Math.floor(stamps / STAMPS_PER_REWARD);

  return {
    stamps,
    progress: stamps % STAMPS_PER_REWARD,
    free: Math.max(0, earnedRewards - redeemed),
  };
}
