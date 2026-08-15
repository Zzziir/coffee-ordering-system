/**
 * Craffé menu — types and pure helpers.
 *
 * The catalog itself now lives in Supabase (see supabase/migrations/0005_menu.sql
 * and lib/menu-store.ts), so an owner or manager can edit it from the admin
 * screen. This module no longer holds the data: it holds the shape of it, and
 * the pure functions that read a loaded `MenuData` bundle. Everything here is
 * client-safe — no database imports — so the browser components can call it on
 * the menu the server handed them.
 */

import type { BranchId } from "./types";

export type AddOn = { id: string; name: string; price: number };

export type AddOnGroup = {
  id: string;
  name: string;
  /** single = pick one (radio, e.g. size/milk); multi = pick any (checkbox) */
  type: "single" | "multi";
  options: AddOn[];
  /** id of the default option for single-select groups */
  defaultOptionId?: string;
};

export type Category = {
  id: string;
  name: string;
  /** small note shown under the section title, e.g. "16oz only" */
  note?: string;
  /** drink earns a loyalty sticker; food does not */
  kind: "drink" | "food";
  /** add-on group ids applicable to every item in this category */
  addOnGroups: string[];
};

export type DietTag =
  | "coffee"
  | "caffeine-free"
  | "dairy"
  | "oat-available"
  | "contains-nuts"
  | "vegan-friendly";

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  /** the bean-marked signatures / bestsellers on the board */
  signature?: boolean;
  description?: string;
  tags?: DietTag[];
  /** Optional product photo (path under /public). When unset, a warm branded
   *  placeholder is shown. Set this per item to swap in real photography. */
  image?: string;
  /** The owner's master switch. false retires the item everywhere; hidden from
   *  the customer menu at every branch. Per-branch sold-out is `unavailableAt`. */
  available: boolean;
  /** Branches where the item is currently sold out. A branch that runs out marks
   *  itself here without touching the others. Empty means available everywhere
   *  the master switch is on. */
  unavailableAt: BranchId[];
};

/** A fully loaded menu: categories in display order, every item, and the
 *  add-on groups keyed by id. This is what lib/menu-store.ts returns and what
 *  the helpers below read. */
export type MenuData = {
  categories: Category[];
  items: MenuItem[];
  addOnGroups: Record<string, AddOnGroup>;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function peso(n: number): string {
  return `₱${n.toLocaleString("en-PH")}`;
}

export function getCategory(menu: MenuData, id: string): Category | undefined {
  return menu.categories.find((c) => c.id === id);
}

export function getItem(menu: MenuData, id: string): MenuItem | undefined {
  return menu.items.find((i) => i.id === id);
}

/** Items in a category, in menu order. Includes unavailable ones — callers that
 *  render the customer menu filter those out (see MenuBrowser). */
export function itemsByCategory(menu: MenuData, categoryId: string): MenuItem[] {
  return menu.items.filter((i) => i.categoryId === categoryId);
}

/**
 * Is this item orderable at a given branch? The master switch must be on and the
 * branch must not have marked it sold out. With no branch chosen yet (a cold
 * visit before the branch gate), fall back to the master switch so the menu
 * isn't empty.
 */
export function isAvailableAt(item: MenuItem, branchId: BranchId | null): boolean {
  if (!item.available) return false;
  return branchId ? !item.unavailableAt.includes(branchId) : true;
}

export function addOnGroupsForItem(menu: MenuData, item: MenuItem): AddOnGroup[] {
  const cat = getCategory(menu, item.categoryId);
  if (!cat) return [];
  return cat.addOnGroups.map((gid) => menu.addOnGroups[gid]).filter(Boolean);
}

/** Available signature bestsellers, used on the home screen. */
export function signatureItems(menu: MenuData): MenuItem[] {
  return menu.items.filter((i) => i.signature && i.available);
}

/* ------------------------------------------------------------------ */
/* Loyalty                                                             */
/* ------------------------------------------------------------------ */

/** Stamps that make one free drink. The card shows nine cups plus the reward. */
export const STAMPS_PER_REWARD = 10;

/** A sticker is earned per drink bought; food (cookies, snacks, pastries) isn't. */
export function isDrinkItem(menu: MenuData, itemId: string): boolean {
  const item = getItem(menu, itemId);
  if (!item) return false;
  return getCategory(menu, item.categoryId)?.kind === "drink";
}

/** How many loyalty stickers a set of order lines is worth (one per drink). */
export function drinkStickers(
  menu: MenuData,
  lines: { itemId: string; qty: number }[],
): number {
  return lines.reduce(
    (total, line) => total + (isDrinkItem(menu, line.itemId) ? line.qty : 0),
    0,
  );
}

/* ------------------------------------------------------------------ */
/* Chatbot                                                             */
/* ------------------------------------------------------------------ */

const TAG_NOTE: Record<DietTag, string> = {
  coffee: "has coffee",
  "caffeine-free": "caffeine-free",
  dairy: "contains dairy",
  "oat-available": "oat milk available",
  "contains-nuts": "contains nuts",
  "vegan-friendly": "dairy-free",
};

/** A compact, grounded description of the available menu for the chatbot. */
export function menuForPrompt(menu: MenuData): string {
  return menu.categories
    .map((cat) => {
      const items = itemsByCategory(menu, cat.id)
        .filter((i) => i.available)
        .map((i) => {
          const notes = (i.tags ?? []).map((t) => TAG_NOTE[t]).join(", ");
          return `  - ${i.name} (id: ${i.id}) — ${peso(i.price)}${i.signature ? " (signature)" : ""}${notes ? ` [${notes}]` : ""}`;
        })
        .join("\n");
      return `${cat.name}${cat.note ? ` (${cat.note})` : ""}:\n${items}`;
    })
    .join("\n\n");
}
