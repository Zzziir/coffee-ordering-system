"use server";

import { redirect } from "next/navigation";
import { getStaffMember, isAdmin } from "@/lib/staff";
import { getBranch, isBranchId } from "@/lib/branches";
import { getMenu } from "@/lib/menu-store";
import { getItem } from "@/lib/menu";
import { createOrder } from "@/lib/store";
import type { OrderLine, PaymentMethod } from "@/lib/types";

/**
 * Logs an in-store / physical sale the admin rings up by hand. It's a normal
 * order on the `onsite` channel, so it lands on the barista board and counts in
 * the analytics like any other. Prices are re-read from the menu here, never
 * trusted from the form.
 */

export type LogOrderState = { error: string } | null;

export async function logOrder(
  _previous: LogOrderState,
  formData: FormData,
): Promise<LogOrderState> {
  const staff = await getStaffMember();
  if (!staff || !isAdmin(staff)) redirect("/staff/sign-in?next=/admin/orders/new");

  const branchId = String(formData.get("branchId") ?? "");
  if (!isBranchId(branchId)) return { error: "Pick a branch." };
  const branch = getBranch(branchId);

  const paymentMethod = String(formData.get("paymentMethod") ?? "") as PaymentMethod;
  if (!branch.payments.includes(paymentMethod)) {
    return { error: `${branch.name} doesn't take that payment method.` };
  }

  const customerName = String(formData.get("customerName") ?? "").trim() || "Walk-in";

  let picks: { itemId: string; qty: number }[];
  try {
    picks = JSON.parse(String(formData.get("payload") ?? "[]"));
  } catch {
    return { error: "Something went wrong reading the order. Try again." };
  }

  const menu = await getMenu();
  const items: OrderLine[] = [];
  picks.forEach((p, i) => {
    const qty = Math.max(0, Math.min(20, Math.floor(Number(p.qty) || 0)));
    if (qty === 0) return;
    const item = getItem(menu, p.itemId);
    if (!item) return;
    items.push({
      id: `line_${i}`,
      itemId: item.id,
      name: item.name,
      basePrice: item.price,
      qty,
      groups: [],
      lineTotal: item.price * qty,
    });
  });

  if (items.length === 0) {
    return { error: "Add at least one item." };
  }

  const order = await createOrder({
    branchId,
    channel: "onsite",
    customerName,
    items,
    paymentMethod,
  });

  redirect(`/order/${order.id}`);
}
