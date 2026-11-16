import { supabaseAdmin } from "./supabase/admin";
import { listCustomerOrders } from "./store";
import { getMenu } from "./menu-store";
import { drinkStickers, STAMPS_PER_REWARD, type MenuData } from "./menu";
import type { Order } from "./types";

/**
 * Loyalty — "10 stamps, 1 free drink", derived, never stored as a balance.
 *
 * A signed-in customer's standing is a pure function of three facts:
 *   seed        stamps carried over from guest ordering, banked at sign-up
 *   drinks      one stamp per drink on their picked-up orders (food earns none)
 *   redeemed    free drinks a reward was spent on (sum of reward_qty)
 *
 * A redeemed drink earns no stamp, and each redemption spends one whole card.
 *
 * Stamps are earned when the drinks are actually in hand — when the order is
 * picked up (status "completed") — not when it's paid for. An order paid online
 * is still just brewing until the barista hands it over. A reward, by contrast,
 * is *reserved* the moment it's applied to an order, so it can't be spent twice.
 * The two sides of the ledger therefore read reward_qty from different sets:
 *
 *   progress / earned  ← completed orders only, so the card fills at pickup, and
 *                         committing a future redemption never dips the progress.
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
  /** Rewards earned over the account's lifetime — monotonic, drives the
   *  once-per-account completion celebration. */
  earnedRewards: number;
  /** Highest earnedRewards already celebrated, or null if never initialized. */
  celebrated: number | null;
};

/** The two stored loyalty facts on a profile. Everything else is derived. */
export type LoyaltyProfile = { seed: number; celebrated: number | null };

/** A customer's stored loyalty facts. A missing profile reads as a blank card. */
export async function getLoyaltyProfile(customerId: string): Promise<LoyaltyProfile> {
  const { data, error } = await supabaseAdmin()
    .from("profiles")
    .select("loyalty_seed, rewards_celebrated")
    .eq("id", customerId)
    .maybeSingle<{ loyalty_seed: number; rewards_celebrated: number | null }>();

  if (error) throw new Error(`Could not read loyalty for ${customerId}: ${error.message}`);
  return { seed: data?.loyalty_seed ?? 0, celebrated: data?.rewards_celebrated ?? null };
}

/**
 * Loyalty standing, read from scratch. A page that already holds the
 * customer's orders should read `getLoyaltyProfile` alongside them and call
 * `computeLoyalty`, rather than have this read the same orders a second time.
 */
export async function getLoyalty(customerId: string): Promise<LoyaltyState> {
  const [profile, orders, menu] = await Promise.all([
    getLoyaltyProfile(customerId),
    listCustomerOrders(customerId),
    getMenu(),
  ]);
  return computeLoyalty(profile, orders, menu);
}

/** Loyalty standing from the stored facts and every order the customer placed. */
export function computeLoyalty(
  profile: LoyaltyProfile,
  orders: Order[],
  menu: MenuData,
): LoyaltyState {
  const { seed } = profile;
  const pickedUp = orders.filter((o) => o.status === "completed");
  const purchasedDrinks = pickedUp.reduce(
    (total, o) => total + drinkStickers(menu, o.items),
    0,
  );
  // Redemptions on picked-up orders adjust the earned tally (the comped drink
  // earns nothing); redemptions on every order reduce what's still spendable, so
  // a reward reserved on an in-progress order can't be used twice.
  const pickedUpRedeemed = pickedUp.reduce((total, o) => total + o.rewardQty, 0);
  const committedRedeemed = orders.reduce((total, o) => total + o.rewardQty, 0);

  const stamps = Math.max(0, seed + purchasedDrinks - pickedUpRedeemed);
  const earnedRewards = Math.floor(stamps / STAMPS_PER_REWARD);

  return {
    stamps,
    progress: stamps % STAMPS_PER_REWARD,
    free: Math.max(0, earnedRewards - committedRedeemed),
    earnedRewards,
    celebrated: profile.celebrated,
  };
}
