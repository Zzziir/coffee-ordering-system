import { NextResponse } from "next/server";
import { getOrder, updateStatus } from "@/lib/store";
import { canAccessBranch, getStaffMember } from "@/lib/staff";
import type { OrderStatus } from "@/lib/types";
import { STATUS_FLOW } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET is deliberately open: a customer is anonymous and holds only their own
// order id, which is the unguessable link their status page already relies on.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  return NextResponse.json({ order });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Advancing an order is a staff action, and only at their own branch.
  const staff = await getStaffMember();
  if (!staff) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const status = (body as { status?: string }).status as OrderStatus;
  if (!STATUS_FLOW.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const existing = await getOrder(id);
  if (!existing) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (!canAccessBranch(staff, existing.branchId)) {
    return NextResponse.json({ error: "Not your branch." }, { status: 403 });
  }

  // The actor goes into order_events, so the audit trail names a person.
  const order = await updateStatus(id, status, { id: staff.id, name: staff.name });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  return NextResponse.json({ order });
}
