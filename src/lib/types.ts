export type OrderStatus = "received" | "preparing" | "ready" | "completed";

export type OrderChannel = "onsite" | "pickup";

export type PaymentMethod = "gcash" | "card" | "cash";

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
  /** short pickup code shown to the customer + called at the window, e.g. "A14" */
  code: string;
  channel: OrderChannel;
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
