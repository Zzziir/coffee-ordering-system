import type {
  BranchId,
  Order,
  OrderLine,
  OrderStatus,
  OrderChannel,
  PaymentMethod,
  SelectedGroup,
} from "./types";
import { getBranch } from "./branches";
import { supabaseAdmin } from "./supabase/admin";

/**
 * Order store — Postgres.
 *
 * Every read and write here runs on the service role. That is deliberate: a
 * customer is anonymous and holds only their own order id, and row level
 * security cannot express "the one row you asked for" (see the note at the foot
 * of supabase/migrations/0001_multi_branch.sql). Branch scope is therefore
 * enforced in app code — by the callers in app/api and app/staff — and every
 * listing here takes a branchId rather than offering an "all branches" read.
 *
 * Writes go through the `create_order` and `advance_order` functions so an
 * order and its lines and audit trail land in one transaction.
 *
 * Nothing here pushes live updates. Supabase Realtime does that, straight from
 * the database — a trigger broadcasts to the customer's per-order topic, and
 * staff read `postgres_changes` under RLS (see 0003_realtime.sql and
 * components/use-order-stream). A change therefore reaches every listener even
 * when it was made by another process, which an in-app event bus could not do.
 *
 * RESEND HOOKS (future): see the marked call-sites in createOrder / updateStatus.
 */

/* ------------------------------------------------------------------ */
/* Reading                                                             */
/* ------------------------------------------------------------------ */

const ORDER_SELECT = `
  id, branch_id, code, channel, table_number, customer_name, customer_phone,
  subtotal, reward_discount, reward_qty, status, payment_method, paid, created_at, updated_at,
  order_lines ( id, position, item_id, name, base_price, qty, groups, line_total, note ),
  order_events ( status, at )
`;

type LineRow = {
  id: string;
  position: number;
  item_id: string;
  name: string;
  base_price: number;
  qty: number;
  groups: SelectedGroup[];
  line_total: number;
  note: string | null;
};

type OrderRow = {
  id: string;
  branch_id: string;
  code: string;
  channel: OrderChannel;
  table_number: string | null;
  customer_name: string;
  customer_phone: string | null;
  subtotal: number;
  reward_discount: number;
  reward_qty: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  paid: boolean;
  created_at: string;
  updated_at: string;
  order_lines: LineRow[];
  order_events: { status: OrderStatus; at: string }[];
};

/** Timestamps cross the wire as ISO strings; the app speaks epoch millis. */
const millis = (iso: string) => new Date(iso).getTime();

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    branchId: row.branch_id as BranchId,
    code: row.code,
    channel: row.channel,
    tableNumber: row.table_number ?? undefined,
    customerName: row.customer_name,
    customerPhone: row.customer_phone ?? undefined,
    items: [...row.order_lines]
      .sort((a, b) => a.position - b.position)
      .map(
        (l): OrderLine => ({
          id: l.id,
          itemId: l.item_id,
          name: l.name,
          basePrice: l.base_price,
          qty: l.qty,
          groups: l.groups ?? [],
          lineTotal: l.line_total,
          note: l.note ?? undefined,
        }),
      ),
    subtotal: row.subtotal,
    rewardDiscount: row.reward_discount,
    rewardQty: row.reward_qty,
    status: row.status,
    paymentMethod: row.payment_method,
    paid: row.paid,
    createdAt: millis(row.created_at),
    updatedAt: millis(row.updated_at),
    statusHistory: [...row.order_events]
      .sort((a, b) => millis(a.at) - millis(b.at))
      .map((e) => ({ status: e.status, at: millis(e.at) })),
  };
}

export async function getOrder(id: string): Promise<Order | undefined> {
  // An id from a URL is not necessarily a uuid; a malformed one is "not found",
  // not a 500.
  if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;

  const { data, error } = await supabaseAdmin()
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", id)
    .maybeSingle<OrderRow>();

  if (error) throw new Error(`Could not read order ${id}: ${error.message}`);
  return data ? toOrder(data) : undefined;
}

/**
 * Orders the barista still needs to act on, oldest first.
 * Always branch-scoped — a barista must never see another branch's queue.
 */
export async function listActiveOrders(branchId: BranchId): Promise<Order[]> {
  const { data, error } = await supabaseAdmin()
    .from("orders")
    .select(ORDER_SELECT)
    .eq("branch_id", branchId)
    .neq("status", "completed")
    .order("created_at", { ascending: true })
    .returns<OrderRow[]>();

  if (error) throw new Error(`Could not read the ${branchId} queue: ${error.message}`);
  return (data ?? []).map(toOrder);
}

/**
 * A customer's own orders, newest first, across every branch.
 *
 * Runs on the service role and scopes to the caller's id in app code — the same
 * pattern the rest of this file uses. The caller (the account page) has already
 * resolved the id from the session, so a customer can only ever ask for theirs.
 */
export async function listCustomerOrders(customerId: string): Promise<Order[]> {
  const { data, error } = await supabaseAdmin()
    .from("orders")
    .select(ORDER_SELECT)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .returns<OrderRow[]>();

  if (error) throw new Error(`Could not read your orders: ${error.message}`);
  return (data ?? []).map(toOrder);
}

export async function listAllOrders(branchId: BranchId): Promise<Order[]> {
  const { data, error } = await supabaseAdmin()
    .from("orders")
    .select(ORDER_SELECT)
    .eq("branch_id", branchId)
    .order("created_at", { ascending: false })
    .returns<OrderRow[]>();

  if (error) throw new Error(`Could not read the ${branchId} history: ${error.message}`);
  return (data ?? []).map(toOrder);
}

/**
 * Every branch's orders, newest first, for the admin analytics screen. This is
 * the one deliberately cross-branch read — it exists only behind the admin gate
 * (owner/manager), never on a barista's branch-scoped board.
 */
export async function listRecentOrders(limit = 500): Promise<Order[]> {
  const { data, error } = await supabaseAdmin()
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<OrderRow[]>();

  if (error) throw new Error(`Could not read orders: ${error.message}`);
  return (data ?? []).map(toOrder);
}

/* ------------------------------------------------------------------ */
/* Writing                                                             */
/* ------------------------------------------------------------------ */

export type CreateOrderInput = {
  branchId: BranchId;
  channel: OrderChannel;
  /** required when channel is "dinein" */
  tableNumber?: string;
  customerName: string;
  customerPhone?: string;
  items: OrderLine[];
  paymentMethod: PaymentMethod;
  /** the signed-in customer this order belongs to, or undefined for a guest */
  customerId?: string;
  /** pesos to comp for redeemed free-drink rewards; omit or 0 for none */
  rewardDiscount?: number;
  /** how many free drinks (rewards) are redeemed on this order; omit or 0 for none */
  rewardQty?: number;
};

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const { data: id, error } = await supabaseAdmin().rpc("create_order", {
    p_branch: input.branchId,
    // The number is the database's; the branch letter in front of it is
    // presentation, and lives in branches.ts.
    p_code_prefix: getBranch(input.branchId).codePrefix,
    p_channel: input.channel,
    p_table_number:
      input.channel === "dinein" ? input.tableNumber?.trim() || null : null,
    p_customer_name: input.customerName.trim(),
    p_customer_phone: input.customerPhone?.trim() || null,
    p_payment_method: input.paymentMethod,
    // Simulated payment: gcash/maya/card are "paid" up front, cash settles at
    // pickup (advance_order flips it when the order completes).
    p_paid: input.paymentMethod !== "cash",
    p_lines: input.items,
    // null for a guest; a uuid when the customer was signed in at checkout.
    p_customer_id: input.customerId ?? null,
    // pesos comped by redeemed rewards; the RPC clamps it to the order gross.
    p_reward_discount: input.rewardDiscount ?? 0,
    // how many free drinks were redeemed, for the loyalty ledger.
    p_reward_qty: input.rewardQty ?? 0,
  });

  if (error) throw new Error(`Could not place the order: ${error.message}`);

  const order = await getOrder(id as string);
  if (!order) throw new Error("Order was written but could not be read back.");

  // RESEND HOOK (future): sendOrderConfirmationEmail(order)

  return order;
}

/** Who moved the order on — recorded against the audit trail. */
export type Actor = { id: string; name: string };

export async function updateStatus(
  id: string,
  status: OrderStatus,
  actor?: Actor,
): Promise<Order | undefined> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;

  const { data: found, error } = await supabaseAdmin().rpc("advance_order", {
    p_order: id,
    p_status: status,
    p_staff: actor?.id ?? null,
    p_staff_name: actor?.name ?? null,
  });

  if (error) throw new Error(`Could not advance order ${id}: ${error.message}`);
  if (!found) return undefined;

  // RESEND HOOK (future): if (status === "ready") sendOrderReadyEmail(order)

  return getOrder(id);
}

/* ------------------------------------------------------------------ */
/* Demo seed                                                           */
/* ------------------------------------------------------------------ */

/** Seed a couple of in-flight orders so the staff screen isn't empty during a
 *  first-time pitch walkthrough. Only fires on a genuinely empty shop. */
export async function ensureDemoSeed(): Promise<void> {
  const { count, error } = await supabaseAdmin()
    .from("orders")
    .select("id", { count: "exact", head: true });

  if (error) throw new Error(`Could not check for existing orders: ${error.message}`);
  if ((count ?? 0) > 0) return;

  await createOrder({
    branchId: "east-rembo",
    channel: "onsite",
    customerName: "Marison",
    items: [
      {
        id: "seed1",
        itemId: "spanish-latte",
        name: "Spanish Latte",
        basePrice: 105,
        qty: 1,
        groups: [
          { groupId: "size-16", groupName: "Size", addOns: [{ id: "size-16-up", name: "Upsize 22oz", price: 20 }] },
          { groupId: "milk", groupName: "Milk", addOns: [{ id: "milk-oat", name: "Oat milk", price: 40 }] },
        ],
        lineTotal: 165,
      },
    ],
    paymentMethod: "gcash",
  });

  const second = await createOrder({
    branchId: "east-rembo",
    channel: "pickup",
    customerName: "JP",
    items: [
      {
        id: "seed2",
        itemId: "biscoff-caramel-frappe",
        name: "Biscoff Caramel Frappé",
        basePrice: 170,
        qty: 1,
        groups: [{ groupId: "frappe-extras", groupName: "Make it yours", addOns: [{ id: "whipped-cream", name: "Whipped cream", price: 30 }] }],
        lineTotal: 200,
      },
      {
        id: "seed3",
        itemId: "cookie-pistachio",
        name: "Pistachio Dubai Chewy Cookie",
        basePrice: 95,
        qty: 2,
        groups: [],
        lineTotal: 190,
      },
    ],
    paymentMethod: "card",
  });
  await updateStatus(second.id, "preparing");

  // A MYCC order too, so switching branches on the staff screen isn't a blank
  // page — and so the dine-in + Maya path has a worked example.
  await createOrder({
    branchId: "mycc",
    channel: "dinein",
    tableNumber: "4",
    customerName: "Ate Nen",
    items: [
      {
        id: "seed4",
        itemId: "spanish-latte",
        name: "Spanish Latte",
        basePrice: 105,
        qty: 2,
        groups: [],
        lineTotal: 210,
      },
    ],
    paymentMethod: "maya",
  });
}
