import type { SelectedGroup } from "./types";

/** A line in the client-side cart before it becomes an order. */
export type CartLine = {
  id: string;
  itemId: string;
  name: string;
  basePrice: number;
  qty: number;
  groups: SelectedGroup[];
  note?: string;
};

/** Per-unit price = base + every selected add-on. */
export function unitPrice(line: Pick<CartLine, "basePrice" | "groups">): number {
  const addOns = line.groups.reduce(
    (sum, g) => sum + g.addOns.reduce((s, a) => s + a.price, 0),
    0,
  );
  return line.basePrice + addOns;
}

export function lineTotal(line: Pick<CartLine, "basePrice" | "groups" | "qty">): number {
  return unitPrice(line) * line.qty;
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + lineTotal(l), 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}

/** Human summary of a line's add-ons, e.g. "Upsize 22oz · Oat milk · Extra shot". */
export function describeLine(line: Pick<CartLine, "groups">): string {
  const parts = line.groups.flatMap((g) => g.addOns.map((a) => a.name));
  return parts.join(" · ");
}
