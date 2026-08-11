"use server";

import { redirect } from "next/navigation";
import { getStaffMember, isAdmin } from "@/lib/staff";
import { getBranch, isBranchId } from "@/lib/branches";
import { getMenu } from "@/lib/menu-store";
import { getItem, addOnGroupsForItem, type AddOn } from "@/lib/menu";
import { createOrder } from "@/lib/store";
import { lineTotal } from "@/lib/cart";
import type { OrderLine, PaymentMethod, SelectedGroup } from "@/lib/types";

/** What the form sends per line: an item, a quantity, and the ids it chose. */
type ItemPick = {
  itemId: string;
  qty: number;
  selections?: { groupId: string; optionIds: string[] }[];
};

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

  let picks: ItemPick[];
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
    if (!item || !item.available) return;

    // Re-resolve every chosen modifier from the menu: the form sends only ids,
    // and each add-on's name and price are read here, never trusted from it. A
    // group that doesn't apply to the item, or an unknown option, is dropped.
    const allowed = new Map(addOnGroupsForItem(menu, item).map((g) => [g.id, g]));
    const groups: SelectedGroup[] = [];
    for (const sel of p.selections ?? []) {
      const group = allowed.get(sel.groupId);
      if (!group) continue;
      const addOns = (sel.optionIds ?? [])
        .map((id) => group.options.find((o) => o.id === id))
        .filter((o): o is AddOn => Boolean(o))
        .map((o) => ({ id: o.id, name: o.name, price: o.price }));
      if (addOns.length > 0) {
        groups.push({ groupId: group.id, groupName: group.name, addOns });
      }
    }

    items.push({
      id: `line_${i}`,
      itemId: item.id,
      name: item.name,
      basePrice: item.price,
      qty,
      groups,
      lineTotal: lineTotal({ basePrice: item.price, groups, qty }),
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
