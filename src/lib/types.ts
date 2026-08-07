export type OrderStatus = "received" | "preparing" | "ready" | "completed";

/** Every Craffé location. Branch data lives in ./branches. */
export type BranchId = "east-rembo" | "mycc";

/**
 * How the customer takes the order. Which of these a branch actually offers is
 * per-branch config — see `Branch.channels` in ./branches.
 *   dinein — seated here, bring it to my table
 *   onsite — I'm here now, I'll collect it at the window/counter
 *   pickup — ordering ahead, ready when I arrive
 */
export type OrderChannel = "dinein" | "onsite" | "pickup";

export type PaymentMethod = "gcash" | "maya" | "card" | "cash";

/** A chosen add-on captured on an order line (name + price frozen at order time). */
export type SelectedAddOn = { id: string; name: string; price: number };

export type SelectedGroup = {
  groupId: string;
  groupName: string;
  addOns: SelectedAddOn[];
};

export type OrderLine = {
  id: string;
  itemId: string;
  name: string;
  basePrice: number;
  qty: number;
  groups: SelectedGroup[];
  /** (base + all add-ons) * qty */
  lineTotal: number;
  note?: string;
};

export type Order = {
  id: string;
  /** which Craffé this order belongs to — scopes the staff queue and the pickup code */
  branchId: BranchId;
  /** short pickup code called out at the branch. Prefixed per branch so two
   *  locations never call the same code: "R14" East Rembo, "M14" MYCC. */
  code: string;
  channel: OrderChannel;
  /** table to bring it to — only set when channel is "dinein" */
  tableNumber?: string;
  customerName: string;
  customerPhone?: string;
  items: OrderLine[];
  subtotal: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paid: boolean;
  createdAt: number;
  updatedAt: number;
  statusHistory: { status: OrderStatus; at: number }[];
};

export const STATUS_FLOW: OrderStatus[] = [
  "received",
  "preparing",
  "ready",
  "completed",
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  received: "Order received",
  preparing: "Preparing",
  ready: "Ready for pickup",
  completed: "Picked up",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  gcash: "GCash",
  maya: "Maya",
  card: "Card",
  cash: "Cash",
};

/** Short label for a channel. Where the collection point is named — "window"
 *  vs "counter" — the copy is per-branch; see `Branch.pickupNoun`. */
export const CHANNEL_LABEL: Record<OrderChannel, string> = {
  dinein: "Dine in",
  onsite: "Pick up now",
  pickup: "Order ahead",
};
