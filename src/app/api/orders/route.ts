import { NextResponse } from "next/server";
import { createOrder, listActiveOrders, listAllOrders } from "@/lib/store";
import { lineTotal } from "@/lib/cart";
import type { OrderChannel, OrderLine, PaymentMethod, SelectedGroup } from "@/lib/types";

export const dynamic = "force-dynamic";

const CHANNELS: OrderChannel[] = ["onsite", "pickup"];
const METHODS: PaymentMethod[] = ["gcash", "card", "cash"];

export async function GET(req: Request) {
  const scope = new URL(req.url).searchParams.get("scope");
  const orders = scope === "all" ? listAllOrders() : listActiveOrders();
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const customerName = typeof b.customerName === "string" ? b.customerName.trim() : "";
  const channel = b.channel as OrderChannel;
  const paymentMethod = b.paymentMethod as PaymentMethod;
  const rawItems = Array.isArray(b.items) ? b.items : [];

  if (!customerName) {
    return NextResponse.json({ error: "A name is required." }, { status: 400 });
  }
  if (!CHANNELS.includes(channel)) {
    return NextResponse.json({ error: "Invalid channel." }, { status: 400 });
  }
  if (!METHODS.includes(paymentMethod)) {
    return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
  }
  if (rawItems.length === 0) {
    return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });
  }

  // Rebuild lines with server-recomputed totals (never trust client math).
  const items: OrderLine[] = rawItems.map((raw, i) => {
    const r = raw as Record<string, unknown>;
    const groups = (Array.isArray(r.groups) ? r.groups : []) as SelectedGroup[];
    const basePrice = Number(r.basePrice) || 0;
    const qty = Math.max(1, Math.min(20, Number(r.qty) || 1));
    return {
      id: `line_${i}_${Math.random().toString(36).slice(2, 8)}`,
      itemId: String(r.itemId ?? ""),
      name: String(r.name ?? "Item"),
      basePrice,
      qty,
      groups,
      note: typeof r.note === "string" ? r.note : undefined,
      lineTotal: lineTotal({ basePrice, groups, qty }),
    };
  });

  const order = createOrder({ channel, customerName, customerPhone: typeof b.customerPhone === "string" ? b.customerPhone : undefined, items, paymentMethod });
  return NextResponse.json({ order }, { status: 201 });
}
