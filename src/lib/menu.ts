/**
 * Craffé menu — transcribed from the printed menu boards.
 * Prices in PHP. This is the single source of truth for the demo; in production
 * it moves to Supabase (see the store abstraction in ./store).
 */

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
};

/* ------------------------------------------------------------------ */
/* Add-on groups                                                       */
/* ------------------------------------------------------------------ */

export const ADD_ON_GROUPS: Record<string, AddOnGroup> = {
  "size-16": {
    id: "size-16",
    name: "Size",
    type: "single",
    defaultOptionId: "size-16-reg",
    options: [
      { id: "size-16-reg", name: "16oz", price: 0 },
      { id: "size-16-up", name: "Upsize 22oz", price: 20 },
    ],
  },
  "size-20": {
    id: "size-20",
    name: "Size",
    type: "single",
    defaultOptionId: "size-20-reg",
    options: [
      { id: "size-20-reg", name: "20oz", price: 0 },
      { id: "size-20-up", name: "Upsize 24oz", price: 20 },
    ],
  },
  milk: {
    id: "milk",
    name: "Milk",
    type: "single",
    defaultOptionId: "milk-fresh",
    options: [
      { id: "milk-fresh", name: "Fresh milk", price: 0 },
      { id: "milk-oat", name: "Oat milk", price: 40 },
    ],
  },
  "espresso-extras": {
    id: "espresso-extras",
    name: "Make it yours",
    type: "multi",
    options: [
      { id: "extra-shot", name: "Extra espresso shot", price: 30 },
      { id: "sea-salt-cream", name: "Sea salt cream", price: 30 },
      { id: "sweetener", name: "Sugar sweetener", price: 10 },
    ],
  },
  "frappe-extras": {
    id: "frappe-extras",
    name: "Make it yours",
    type: "multi",
    options: [
      { id: "whipped-cream", name: "Whipped cream", price: 30 },
      { id: "nata", name: "Nata de coco", price: 10 },
      { id: "sweetener-f", name: "Sugar sweetener", price: 10 },
    ],
  },
  sweetener: {
    id: "sweetener",
    name: "Make it yours",
    type: "multi",
    options: [{ id: "sweetener-s", name: "Sugar sweetener", price: 10 }],
  },
};

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export const CATEGORIES: Category[] = [
  {
    id: "espresso",
    name: "Espresso",
    note: "16oz · +₱20 upsize",
    addOnGroups: ["size-16", "milk", "espresso-extras"],
  },
  {
    id: "non-coffee",
    name: "Non-Coffee",
    note: "16oz · +₱20 upsize",
    addOnGroups: ["size-16", "milk", "sweetener"],
  },
  {
    id: "frappe-coffee",
    name: "Coffee Frappé",
    note: "20oz · +₱20 upsize",
    addOnGroups: ["size-20", "frappe-extras"],
  },
  {
    id: "frappe-cream",
    name: "Cream Frappé",
    note: "20oz · +₱20 upsize",
    addOnGroups: ["size-20", "frappe-extras"],
  },
  {
    id: "thai-tea",
    name: "Thai Tea",
    note: "16oz only",
    addOnGroups: ["sweetener"],
  },
  {
    id: "refreshers",
    name: "Refreshers",
    note: "Sparkling · 16oz",
    addOnGroups: ["size-16"],
  },
  {
    id: "cookies",
    name: "Dubai Chewy Cookies",
    addOnGroups: [],
  },
  {
    id: "snacks",
    name: "Snacks",
    addOnGroups: [],
  },
  {
    id: "pastries",
    name: "Pastries",
    addOnGroups: [],
  },
  {
    id: "bottled",
    name: "Bottled",
    note: "Grab & go",
    addOnGroups: [],
  },
];

/* ------------------------------------------------------------------ */
/* Items                                                               */
/* ------------------------------------------------------------------ */

export const MENU_ITEMS: MenuItem[] = [
  // Espresso-based (16oz)
  { id: "americano", name: "Americano", price: 75, categoryId: "espresso", tags: ["coffee", "caffeine-free"] },
  { id: "craffeccino", name: "Crafféccino", price: 80, categoryId: "espresso", tags: ["coffee", "dairy"] },
  { id: "cappuccino", name: "Cappuccino", price: 100, categoryId: "espresso", tags: ["coffee", "dairy", "oat-available"] },
  { id: "flat-white", name: "Flat White", price: 100, categoryId: "espresso", tags: ["coffee", "dairy", "oat-available"] },
  { id: "caramel-macchiato", name: "Caramel Macchiato", price: 105, categoryId: "espresso", signature: true, tags: ["coffee", "dairy", "oat-available"] },
  { id: "mocha", name: "Mocha", price: 105, categoryId: "espresso", tags: ["coffee", "dairy", "oat-available"] },
  { id: "white-mocha", name: "White Mocha", price: 105, categoryId: "espresso", tags: ["coffee", "dairy", "oat-available"] },
  { id: "spanish-latte", name: "Spanish Latte", price: 105, categoryId: "espresso", signature: true, tags: ["coffee", "dairy", "oat-available"] },
  { id: "vanilla-latte", name: "Vanilla Latte", price: 105, categoryId: "espresso", tags: ["coffee", "dairy", "oat-available"] },
  { id: "hazelnut-latte", name: "Hazelnut Latte", price: 115, categoryId: "espresso", tags: ["coffee", "dairy", "oat-available", "contains-nuts"] },
  { id: "sea-salt-latte", name: "Sea Salt Latte", price: 120, categoryId: "espresso", signature: true, tags: ["coffee", "dairy", "oat-available"] },
  { id: "hazelnut-mocha", name: "Hazelnut Mocha", price: 120, categoryId: "espresso", signature: true, tags: ["coffee", "dairy", "oat-available", "contains-nuts"] },
  { id: "macadamia-oat-latte", name: "Macadamia Oat Latte", price: 130, categoryId: "espresso", tags: ["coffee", "oat-available", "contains-nuts"] },
  { id: "irish-cream-oat-latte", name: "Irish Cream Oat Latte", price: 130, categoryId: "espresso", tags: ["coffee", "oat-available"] },
  { id: "biscoff-latte", name: "Biscoff Latte", price: 140, categoryId: "espresso", tags: ["coffee", "dairy", "oat-available"] },
  { id: "biscoff-caramel-latte", name: "Biscoff Caramel Latte", price: 150, categoryId: "espresso", signature: true, tags: ["coffee", "dairy", "oat-available"] },
  { id: "smores-latte", name: "S'mores Latte", price: 150, categoryId: "espresso", tags: ["coffee", "dairy", "oat-available"] },

  // Non-coffee (16oz)
  { id: "strawberry-milk", name: "Strawberry Milk", price: 100, categoryId: "non-coffee", tags: ["caffeine-free", "dairy", "oat-available"] },
  { id: "signature-chocolate", name: "Signature Chocolate", price: 110, categoryId: "non-coffee", signature: true, tags: ["caffeine-free", "dairy", "oat-available"] },
  { id: "matcha-latte", name: "Matcha Latte", price: 105, categoryId: "non-coffee", signature: true, tags: ["dairy", "oat-available"] },
  { id: "chocolate-smores", name: "Chocolate S'mores", price: 120, categoryId: "non-coffee", tags: ["caffeine-free", "dairy", "oat-available"] },
  { id: "sea-salt-matcha", name: "Sea Salt Matcha", price: 125, categoryId: "non-coffee", signature: true, tags: ["dairy", "oat-available"] },
  { id: "strawberry-matcha", name: "Strawberry Matcha", price: 125, categoryId: "non-coffee", tags: ["dairy", "oat-available"] },
  { id: "strawberry-caramel-mousse", name: "Strawberry Caramel Mousse", price: 130, categoryId: "non-coffee", tags: ["caffeine-free", "dairy"] },
  { id: "creamy-biscoff", name: "Creamy Biscoff", price: 130, categoryId: "non-coffee", tags: ["caffeine-free", "dairy"] },
  { id: "creamy-biscoff-caramel", name: "Creamy Biscoff Caramel", price: 140, categoryId: "non-coffee", signature: true, tags: ["caffeine-free", "dairy"] },

  // Coffee-based frappé (20oz)
  { id: "java-chip-frappe", name: "Java Chip Frappé", price: 150, categoryId: "frappe-coffee", signature: true, tags: ["coffee", "dairy"] },
  { id: "caramel-frappe", name: "Caramel Frappé", price: 150, categoryId: "frappe-coffee", tags: ["coffee", "dairy"] },
  { id: "mocha-frappe", name: "Mocha Frappé", price: 150, categoryId: "frappe-coffee", tags: ["coffee", "dairy"] },
  { id: "white-mocha-frappe", name: "White Mocha Frappé", price: 150, categoryId: "frappe-coffee", tags: ["coffee", "dairy"] },
  { id: "hazelnut-mocha-frappe", name: "Hazelnut Mocha Frappé", price: 160, categoryId: "frappe-coffee", tags: ["coffee", "dairy", "contains-nuts"] },
  { id: "biscoff-caramel-frappe", name: "Biscoff Caramel Frappé", price: 170, categoryId: "frappe-coffee", signature: true, tags: ["coffee", "dairy"] },

  // Cream-based frappé (20oz)
  { id: "signature-chocolate-frappe", name: "Signature Chocolate Frappé", price: 130, categoryId: "frappe-cream", tags: ["caffeine-free", "dairy"] },
  { id: "strawberry-cream-frappe", name: "Strawberry Cream Frappé", price: 130, categoryId: "frappe-cream", tags: ["caffeine-free", "dairy"] },
  { id: "cookies-and-cream-frappe", name: "Cookies and Cream Frappé", price: 130, categoryId: "frappe-cream", tags: ["caffeine-free", "dairy"] },
  { id: "matcha-cream-frappe", name: "Matcha Cream Frappé", price: 140, categoryId: "frappe-cream", tags: ["dairy"] },
  { id: "crema-nutella-frappe", name: "Crema Nutella Frappé", price: 150, categoryId: "frappe-cream", tags: ["caffeine-free", "dairy", "contains-nuts"] },
  { id: "creamy-biscoff-frappe", name: "Creamy Biscoff Frappé", price: 160, categoryId: "frappe-cream", signature: true, tags: ["caffeine-free", "dairy"] },

  // Thai tea (16oz only)
  { id: "thai-tea", name: "Thai Tea", price: 80, categoryId: "thai-tea", signature: true, tags: ["caffeine-free"] },
  { id: "thai-milk-tea", name: "Thai Milk Tea", price: 90, categoryId: "thai-tea", tags: ["caffeine-free", "dairy"] },
  { id: "thai-lemon-tea", name: "Thai Lemon Tea", price: 90, categoryId: "thai-tea", tags: ["caffeine-free", "vegan-friendly"] },

  // Refreshers (sparkling, 16oz)
  { id: "refresher-blueberry", name: "Blueberry", price: 80, categoryId: "refreshers", tags: ["caffeine-free", "vegan-friendly"] },
  { id: "refresher-strawberry", name: "Strawberry", price: 80, categoryId: "refreshers", tags: ["caffeine-free", "vegan-friendly"] },
  { id: "refresher-green-apple", name: "Green Apple", price: 80, categoryId: "refreshers", tags: ["caffeine-free", "vegan-friendly"] },
  { id: "refresher-lychee", name: "Lychee", price: 80, categoryId: "refreshers", tags: ["caffeine-free", "vegan-friendly"] },

  // Dubai chewy cookies
  {
    id: "cookie-pistachio",
    name: "Pistachio Dubai Chewy Cookie",
    price: 95,
    categoryId: "cookies",
    signature: true,
    description: "Soft-baked, filled with creamy pistachio. Nutty and rich, perfect with your coffee.",
    tags: ["contains-nuts", "dairy"],
  },
  {
    id: "cookie-biscoff",
    name: "Biscoff Dubai Chewy Cookie",
    price: 95,
    categoryId: "cookies",
    description: "Chewy cookie with a crunchy cookie-butter center and sweet caramel notes.",
    tags: ["dairy"],
  },
  {
    id: "cookie-nutella",
    name: "Nutella Dubai Chewy Cookie",
    price: 95,
    categoryId: "cookies",
    description: "Chewy and crunchy with a choco-hazelnut core. A café classic in every bite.",
    tags: ["dairy", "contains-nuts"],
  },

  // Snacks
  { id: "fries", name: "Fries", price: 60, categoryId: "snacks" },
  { id: "cheese-sticks", name: "Cheese Sticks", price: 70, categoryId: "snacks", description: "5 pieces." },
  { id: "french-toast", name: "French Toast", price: 70, categoryId: "snacks", description: "2 pieces." },
  { id: "grilled-cheese", name: "Grilled Cheese", price: 120, categoryId: "snacks", description: "Served with fries." },

  // Pastries
  { id: "chocolate-cake", name: "Chocolate Cake", price: 40, categoryId: "pastries", tags: ["dairy"] },
  { id: "banana-cake", name: "Banana Cake", price: 40, categoryId: "pastries", tags: ["dairy"] },
  { id: "choco-chips-brownie", name: "Choco Chips Brownie", price: 40, categoryId: "pastries", tags: ["dairy"] },
  { id: "smores-brownie", name: "S'mores Brownie", price: 40, categoryId: "pastries", tags: ["dairy"] },
  { id: "biscoff-blondie", name: "Biscoff Blondie", price: 50, categoryId: "pastries", tags: ["dairy"] },
  { id: "pistachio-brownie", name: "Pistachio Brownie", price: 130, categoryId: "pastries", signature: true, description: "Regular. Double for ₱250.", tags: ["dairy", "contains-nuts"] },

  // Bottled — grab & go (fixed size)
  { id: "bottled-americano", name: "Americano", price: 95, categoryId: "bottled", tags: ["coffee"] },
  { id: "bottled-craffeccino", name: "Crafféccino", price: 100, categoryId: "bottled", tags: ["coffee", "dairy"] },
  { id: "bottled-flat-white", name: "Flat White", price: 120, categoryId: "bottled", tags: ["coffee", "dairy"] },
  { id: "bottled-caramel-macchiato", name: "Caramel Macchiato", price: 125, categoryId: "bottled", tags: ["coffee", "dairy"] },
  { id: "bottled-spanish-latte", name: "Spanish Latte", price: 125, categoryId: "bottled", signature: true, tags: ["coffee", "dairy"] },
  { id: "bottled-hazelnut-latte", name: "Hazelnut Latte", price: 135, categoryId: "bottled", tags: ["coffee", "dairy", "contains-nuts"] },
  { id: "bottled-biscoff-latte", name: "Biscoff Latte", price: 160, categoryId: "bottled", tags: ["coffee", "dairy"] },
  { id: "bottled-signature-chocolate", name: "Signature Chocolate", price: 130, categoryId: "bottled", tags: ["caffeine-free", "dairy"] },
  { id: "bottled-matcha-latte", name: "Matcha Latte", price: 125, categoryId: "bottled", tags: ["dairy"] },
  { id: "bottled-sea-salt-matcha", name: "Sea Salt Matcha", price: 145, categoryId: "bottled", signature: true, tags: ["dairy"] },
  { id: "bottled-strawberry-milk", name: "Strawberry Milk", price: 120, categoryId: "bottled", tags: ["caffeine-free", "dairy"] },
  { id: "bottled-creamy-biscoff", name: "Creamy Biscoff", price: 150, categoryId: "bottled", tags: ["caffeine-free", "dairy"] },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function peso(n: number): string {
  return `₱${n.toLocaleString("en-PH")}`;
}

export function getCategory(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getItem(id: string): MenuItem | undefined {
  return MENU_ITEMS.find((i) => i.id === id);
}

export function itemsByCategory(categoryId: string): MenuItem[] {
  return MENU_ITEMS.filter((i) => i.categoryId === categoryId);
}

export function addOnGroupsForItem(item: MenuItem): AddOnGroup[] {
  const cat = getCategory(item.categoryId);
  if (!cat) return [];
  return cat.addOnGroups.map((gid) => ADD_ON_GROUPS[gid]).filter(Boolean);
}

/** Signature bestsellers, used on the home screen. */
export function signatureItems(): MenuItem[] {
  return MENU_ITEMS.filter((i) => i.signature);
}

const TAG_NOTE: Record<DietTag, string> = {
  coffee: "has coffee",
  "caffeine-free": "caffeine-free",
  dairy: "contains dairy",
  "oat-available": "oat milk available",
  "contains-nuts": "contains nuts",
  "vegan-friendly": "dairy-free",
};

/** A compact, grounded description of the full menu for the chatbot. */
export function menuForPrompt(): string {
  return CATEGORIES.map((cat) => {
    const items = itemsByCategory(cat.id)
      .map((i) => {
        const notes = (i.tags ?? []).map((t) => TAG_NOTE[t]).join(", ");
        return `  - ${i.name} (id: ${i.id}) — ${peso(i.price)}${i.signature ? " (signature)" : ""}${notes ? ` [${notes}]` : ""}`;
      })
      .join("\n");
    return `${cat.name}${cat.note ? ` (${cat.note})` : ""}:\n${items}`;
  }).join("\n\n");
}
