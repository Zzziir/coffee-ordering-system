import { NextResponse } from "next/server";
import { createOrder, listActiveOrders, listAllOrders } from "@/lib/store";
import { lineTotal } from "@/lib/cart";
import { getBranch, isBranchId } from "@/lib/branches";
import { canAccessBranch, getStaffMember } from "@/lib/staff";
import { getCustomer } from "@/lib/customer";
import type { OrderChannel, OrderLine, PaymentMethod, SelectedGroup } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const branchId = params.get("branch");

  // Branch-scoped by design: there is no "every branch" listing here, so a
  // barista's screen can't be pointed at another store's queue.
  if (!isBranchId(branchId)) {
    return NextResponse.json({ error: "Unknown branch." }, { status: 400 });
  }

  // A queue carries customer names and phone numbers, so this is staff-only —
  // gating the page but not the endpoint behind it would protect nothing.
  const staff = await getStaffMember();
  if (!staff) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  if (!canAccessBranch(staff, branchId)) {
    return NextResponse.json({ error: "Not your branch." }, { status: 403 });
  }

  const orders =
    params.get("scope") === "all"
      ? await listAllOrders(branchId)
      : await listActiveOrders(branchId);
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
  const tableNumber = typeof b.tableNumber === "string" ? b.tableNumber.trim() : "";
  const rawItems = Array.isArray(b.items) ? b.items : [];

  if (!isBranchId(b.branchId)) {
    return NextResponse.json({ error: "Unknown branch." }, { status: 400 });
  }
  const branch = getBranch(b.branchId);

  if (!customerName) {
    return NextResponse.json({ error: "A name is required." }, { status: 400 });
  }
  // Channels and payment methods are per-branch config. Validate against this
  // branch's list, not a global union — the client renders from the same source
  // but must never be the thing that decides.
  if (!branch.channels.includes(channel)) {
    return NextResponse.json(
      { error: `${branch.name} doesn't offer that order type.` },
      { status: 400 },
    );
  }
  if (!branch.payments.includes(paymentMethod)) {
    return NextResponse.json(
      { error: `${branch.name} doesn't accept that payment method.` },
      { status: 400 },
    );
  }
  if (channel === "dinein" && !tableNumber) {
    return NextResponse.json({ error: "A table number is required." }, { status: 400 });
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

  // Attach the order to the signed-in customer, if there is one. Identity comes
  // from the session cookie, never the request body — a guest simply has none,
  // and their order stays anonymous.
  const customer = await getCustomer();

  const order = await createOrder({
    branchId: branch.id,
    channel,
    tableNumber: tableNumber || undefined,
    customerName,
    customerPhone: typeof b.customerPhone === "string" ? b.customerPhone : undefined,
    items,
    paymentMethod,
    customerId: customer?.id,
  });
  return NextResponse.json({ order }, { status: 201 });
}
