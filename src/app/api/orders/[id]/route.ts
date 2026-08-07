import { NextResponse } from "next/server";
import { getOrder, updateStatus } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";
import { STATUS_FLOW } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const order = getOrder(id);
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
  const order = updateStatus(id, status);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  return NextResponse.json({ order });
}
