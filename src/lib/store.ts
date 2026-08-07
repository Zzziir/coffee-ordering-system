import type { Order, OrderLine, OrderStatus, OrderChannel, PaymentMethod } from "./types";

/**
 * Order store — demo adapter.
 *
 * This is an in-memory implementation with a change event-bus so the staff
 * queue and the customer status page update live (via SSE). It runs with zero
 * external services so the pitch prototype works on `npm run dev` alone.
 *
 * PRODUCTION PATH (future): replace the internals of this module with Supabase.
 *   - createOrder      -> insert into `orders` + `order_lines`
 *   - updateStatus     -> update row; Supabase Realtime replaces the event bus
 *   - subscribe        -> supabase.channel('orders').on('postgres_changes', ...)
 * The exported function signatures stay identical, so nothing upstream changes.
 *
 * RESEND HOOKS (future): see the marked call-sites in createOrder / updateStatus.
 */

type Listener = (order: Order) => void;

type Store = {
  orders: Map<string, Order>;
  listeners: Set<Listener>;
  seq: number;
};

// Survive Next.js HMR / route-handler module reloads in dev by pinning to global.
const g = globalThis as unknown as { __craffeStore?: Store };
const store: Store =
  g.__craffeStore ??
  (g.__craffeStore = { orders: new Map(), listeners: new Set(), seq: 13 });

function emit(order: Order) {
  for (const l of store.listeners) {
    try {
      l(order);
    } catch {
      /* a dead SSE connection shouldn't break the others */
    }
  }
}

/** Pickup code like A14, A15 … rolling A–Z then wrapping. */
function nextCode(): string {
  store.seq += 1;
  const letter = String.fromCharCode(65 + (Math.floor(store.seq / 100) % 26));
  const num = store.seq % 100;
  return `${letter}${num.toString().padStart(2, "0")}`;
}

export type CreateOrderInput = {
  channel: OrderChannel;
  customerName: string;
  customerPhone?: string;
  items: OrderLine[];
  paymentMethod: PaymentMethod;
};

export function createOrder(input: CreateOrderInput): Order {
  const now = Date.now();
  const id = `ord_${now.toString(36)}_${Math.floor(store.seq * 7).toString(36)}`;
  const subtotal = input.items.reduce((sum, l) => sum + l.lineTotal, 0);
  const order: Order = {
    id,
    code: nextCode(),
    channel: input.channel,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone?.trim() || undefined,
    items: input.items,
    subtotal,
    status: "received",
    paymentMethod: input.paymentMethod,
    // Simulated payment: gcash/card are "paid" up front, cash settles at pickup.
    paid: input.paymentMethod !== "cash",
    createdAt: now,
    updatedAt: now,
    statusHistory: [{ status: "received", at: now }],
  };
  store.orders.set(id, order);
  emit(order);

  // RESEND HOOK (future): sendOrderConfirmationEmail(order)

  return order;
}

export function getOrder(id: string): Order | undefined {
  return store.orders.get(id);
}

/** Orders the barista still needs to act on, oldest first. */
export function listActiveOrders(): Order[] {
  return [...store.orders.values()]
    .filter((o) => o.status !== "completed")
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function listAllOrders(): Order[] {
  return [...store.orders.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export function updateStatus(id: string, status: OrderStatus): Order | undefined {
  const order = store.orders.get(id);
  if (!order) return undefined;
  order.status = status;
  order.updatedAt = Date.now();
  order.statusHistory.push({ status, at: order.updatedAt });
  if (status === "completed" && order.paymentMethod === "cash") {
    order.paid = true;
  }
  store.orders.set(id, order);
  emit(order);

  // RESEND HOOK (future): if (status === "ready") sendOrderReadyEmail(order)

  return order;
}

/** Subscribe to every order change. Returns an unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  store.listeners.add(listener);
  return () => store.listeners.delete(listener);
}

/** Demo helper: seed a couple of in-flight orders so the staff screen isn't
 *  empty during a first-time pitch walkthrough. Safe to call repeatedly. */
export function ensureDemoSeed() {
  if (store.orders.size > 0) return;
  createOrder({
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
  const second = createOrder({
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
  updateStatus(second.id, "preparing");
}
