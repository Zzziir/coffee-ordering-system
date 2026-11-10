import type { Order, OrderStatus } from "./types";
import { ORDER_SELECT, toOrder, type OrderRow } from "./store";
import { supabaseAdmin } from "./supabase/admin";

/**
 * Order reads for the back office reports.
 *
 * These carry two fields the customer-facing `Order` deliberately leaves out:
 * who placed it and which bazaar it was sold at. They stay on a separate type
 * so neither can leak through the public order endpoints, which serialize a
 * plain `Order` to whoever holds the link.
 *
 * Cross-branch and service role, so every caller must sit behind the admin gate.
 */

export type AdminOrder = Order & {
  /** The signed-in customer, or null for a guest or walk-in. */
  customerId: string | null;
  /** The bazaar it was sold at, or null for a store sale. */
  eventId: string | null;
};

const ADMIN_SELECT = `${ORDER_SELECT}, customer_id, event_id`;

type AdminRow = OrderRow & { customer_id: string | null; event_id: string | null };

const toAdminOrder = (row: AdminRow): AdminOrder => ({
  ...toOrder(row),
  customerId: row.customer_id,
  eventId: row.event_id,
});

// PostgREST caps a response at 1000 rows, so a report reads in pages.
const PAGE = 1000;

export type OrderFilter = {
  /** Inclusive lower bound, epoch ms. */
  from?: number;
  /** Exclusive upper bound, epoch ms. */
  to?: number;
  eventId?: string;
  /** Only sales made at a bazaar, whichever one. */
  eventSalesOnly?: boolean;
  customerId?: string;
};

/** Orders matching the filter, newest first. Reads every page. */
export async function listOrders(filter: OrderFilter = {}): Promise<AdminOrder[]> {
  const all: AdminOrder[] = [];

  for (let page = 0; ; page += 1) {
    let query = supabaseAdmin()
      .from("orders")
      .select(ADMIN_SELECT)
      .order("created_at", { ascending: false })
      .range(page * PAGE, page * PAGE + PAGE - 1);

    if (filter.from !== undefined) query = query.gte("created_at", new Date(filter.from).toISOString());
    if (filter.to !== undefined) query = query.lt("created_at", new Date(filter.to).toISOString());
    if (filter.eventId) query = query.eq("event_id", filter.eventId);
    if (filter.eventSalesOnly) query = query.not("event_id", "is", null);
    if (filter.customerId) query = query.eq("customer_id", filter.customerId);

    const { data, error } = await query.returns<AdminRow[]>();
    if (error) throw new Error(`Could not read orders: ${error.message}`);

    const rows = data ?? [];
    all.push(...rows.map(toAdminOrder));
    if (rows.length < PAGE) return all;
  }
}

/** One step in an order's life, and who on staff moved it there. */
export type OrderStep = { status: OrderStatus; at: number; staffName: string | null };

export type AdminOrderDetail = AdminOrder & { steps: OrderStep[] };

/** One order with its full history, for the detail page. undefined when missing. */
export async function getAdminOrder(id: string): Promise<AdminOrderDetail | undefined> {
  // An id from a URL is not necessarily a uuid; a malformed one is "not found",
  // not a 500.
  if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;

  const db = supabaseAdmin();
  const [order, steps] = await Promise.all([
    db.from("orders").select(ADMIN_SELECT).eq("id", id).maybeSingle<AdminRow>(),
    db
      .from("order_events")
      .select("status, at, staff_name")
      .eq("order_id", id)
      .order("at", { ascending: true })
      .returns<{ status: OrderStatus; at: string; staff_name: string | null }[]>(),
  ]);

  if (order.error) throw new Error(`Could not read order ${id}: ${order.error.message}`);
  if (steps.error) throw new Error(`Could not read order ${id} history: ${steps.error.message}`);
  if (!order.data) return undefined;

  return {
    ...toAdminOrder(order.data),
    steps: (steps.data ?? []).map((step) => ({
      status: step.status,
      at: new Date(step.at).getTime(),
      staffName: step.staff_name,
    })),
  };
}

/** Move a sale onto an event, or back to a plain store sale with null. */
export async function setOrderEvent(orderId: string, eventId: string | null): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("orders")
    .update({ event_id: eventId })
    .eq("id", orderId);

  if (error) throw new Error(`Could not move the sale: ${error.message}`);
}
