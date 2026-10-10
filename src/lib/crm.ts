import type { BranchId } from "./types";
import type { AdminOrder } from "./admin-orders";
import { DAY_MS } from "./analytics";
import { supabaseAdmin } from "./supabase/admin";

/**
 * Customer relationship view: who the registered customers are and how they
 * buy. A customer here is someone with an account. Guests and walk-ins leave
 * only a first name on the order, which is not enough to tell two people
 * apart, so they are counted in aggregate and never listed as individuals.
 *
 * Service role, admin gate only: this reads names, emails and phone numbers.
 */

export type CustomerProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  age: number | null;
  favoriteFlavor: string | null;
  joinedAt: number;
};

type ProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  age: number | null;
  favorite_flavor: string | null;
  created_at: string;
};

const PROFILE_SELECT = "id, first_name, last_name, email, phone, age, favorite_flavor, created_at";

const toProfile = (row: ProfileRow): CustomerProfile => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  phone: row.phone,
  age: row.age,
  favoriteFlavor: row.favorite_flavor,
  joinedAt: new Date(row.created_at).getTime(),
});

export async function listProfiles(): Promise<CustomerProfile[]> {
  const { data, error } = await supabaseAdmin()
    .from("profiles")
    .select(PROFILE_SELECT)
    .order("created_at", { ascending: false })
    .returns<ProfileRow[]>();

  if (error) throw new Error(`Could not read customers: ${error.message}`);
  return (data ?? []).map(toProfile);
}

export async function getProfile(id: string): Promise<CustomerProfile | undefined> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;

  const { data, error } = await supabaseAdmin()
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", id)
    .maybeSingle<ProfileRow>();

  if (error) throw new Error(`Could not read customer ${id}: ${error.message}`);
  return data ? toProfile(data) : undefined;
}

/* ------------------------------------------------------------------ */
/* Segments                                                            */
/* ------------------------------------------------------------------ */

/**
 * Where a customer is in their relationship with the shop. Recency is checked
 * before frequency: a once-loyal customer who has stopped coming is the one
 * worth a message, so "lapsed" must win over "loyal".
 */
export type Segment = "loyal" | "repeat" | "new" | "at-risk" | "lapsed" | "no-orders";

export const SEGMENTS: Segment[] = ["loyal", "repeat", "new", "at-risk", "lapsed", "no-orders"];

export const SEGMENT_LABEL: Record<Segment, string> = {
  loyal: "Loyal",
  repeat: "Repeat",
  new: "New",
  "at-risk": "At risk",
  lapsed: "Lapsed",
  "no-orders": "No orders yet",
};

export const SEGMENT_HINT: Record<Segment, string> = {
  loyal: "5 or more orders, bought in the last 30 days",
  repeat: "2 to 4 orders, bought in the last 30 days",
  new: "1 order, in the last 30 days",
  "at-risk": "No order in 31 to 60 days",
  lapsed: "No order in over 60 days",
  "no-orders": "Signed up but has not ordered",
};

const AT_RISK_AFTER_DAYS = 30;
const LAPSED_AFTER_DAYS = 60;
const LOYAL_ORDERS = 5;
const REPEAT_ORDERS = 2;

export const isSegment = (value: unknown): value is Segment => SEGMENTS.includes(value as Segment);

export function segmentOf(orders: number, lastOrderAt: number | null, now: number): Segment {
  if (orders === 0 || lastOrderAt === null) return "no-orders";

  const idleDays = (now - lastOrderAt) / DAY_MS;
  if (idleDays > LAPSED_AFTER_DAYS) return "lapsed";
  if (idleDays > AT_RISK_AFTER_DAYS) return "at-risk";
  if (orders >= LOYAL_ORDERS) return "loyal";
  if (orders >= REPEAT_ORDERS) return "repeat";
  return "new";
}

/* ------------------------------------------------------------------ */
/* Per-customer figures                                                */
/* ------------------------------------------------------------------ */

export type CustomerStats = {
  orders: number;
  /** Lifetime spend, whole pesos. */
  spend: number;
  aov: number;
  firstOrderAt: number | null;
  lastOrderAt: number | null;
  /** The item bought most, by units. */
  favoriteItem: string | null;
  /** The branch ordered from most. */
  homeBranch: BranchId | null;
  segment: Segment;
};

const mostFrequent = <K>(counts: Map<K, number>): K | null => {
  let best: K | null = null;
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
};

/** One customer's figures from their paid orders. */
export function customerStats(orders: AdminOrder[], now: number): CustomerStats {
  const spend = orders.reduce((sum, o) => sum + o.subtotal, 0);
  const times = orders.map((o) => o.createdAt);
  const lastOrderAt = times.length ? Math.max(...times) : null;

  const itemUnits = new Map<string, number>();
  const branchOrders = new Map<BranchId, number>();
  for (const order of orders) {
    branchOrders.set(order.branchId, (branchOrders.get(order.branchId) ?? 0) + 1);
    for (const line of order.items) {
      itemUnits.set(line.name, (itemUnits.get(line.name) ?? 0) + line.qty);
    }
  }

  return {
    orders: orders.length,
    spend,
    aov: orders.length ? Math.round(spend / orders.length) : 0,
    firstOrderAt: times.length ? Math.min(...times) : null,
    lastOrderAt,
    favoriteItem: mostFrequent(itemUnits),
    homeBranch: mostFrequent(branchOrders),
    segment: segmentOf(orders.length, lastOrderAt, now),
  };
}

export type Customer = CustomerProfile & CustomerStats;

/** Every registered customer with their figures, biggest spenders first. */
export function buildCustomers(
  profiles: CustomerProfile[],
  paidOrders: AdminOrder[],
  now: number,
): Customer[] {
  const byCustomer = new Map<string, AdminOrder[]>();
  for (const order of paidOrders) {
    if (!order.customerId) continue;
    const list = byCustomer.get(order.customerId) ?? [];
    list.push(order);
    byCustomer.set(order.customerId, list);
  }

  return profiles
    .map((profile) => ({ ...profile, ...customerStats(byCustomer.get(profile.id) ?? [], now) }))
    .sort((a, b) => b.spend - a.spend || b.joinedAt - a.joinedAt);
}

export type CrmSummary = {
  customers: number;
  /** Customers with at least one order. */
  buyers: number;
  /** Share of buyers who came back for a second order, 0 to 1. */
  repeatRate: number;
  /** Average lifetime spend per buyer. */
  lifetimeValue: number;
  /** Share of all revenue that came from signed-in customers, 0 to 1. */
  memberRevenueShare: number;
  memberAov: number;
  guestAov: number;
};

export function crmSummary(customers: Customer[], paidOrders: AdminOrder[]): CrmSummary {
  const buyers = customers.filter((c) => c.orders > 0);
  const repeaters = buyers.filter((c) => c.orders >= REPEAT_ORDERS);
  const memberSpend = buyers.reduce((sum, c) => sum + c.spend, 0);

  const member = paidOrders.filter((o) => o.customerId);
  const guest = paidOrders.filter((o) => !o.customerId);
  const revenueOf = (list: AdminOrder[]) => list.reduce((sum, o) => sum + o.subtotal, 0);
  const total = revenueOf(paidOrders);
  const aovOf = (list: AdminOrder[]) => (list.length ? Math.round(revenueOf(list) / list.length) : 0);

  return {
    customers: customers.length,
    buyers: buyers.length,
    repeatRate: buyers.length ? repeaters.length / buyers.length : 0,
    lifetimeValue: buyers.length ? Math.round(memberSpend / buyers.length) : 0,
    memberRevenueShare: total ? revenueOf(member) / total : 0,
    memberAov: aovOf(member),
    guestAov: aovOf(guest),
  };
}
