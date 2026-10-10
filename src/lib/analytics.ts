import type { Order, OrderLine } from "./types";
import type { MenuData } from "./menu";

/**
 * Sales analytics: pure functions over orders, no I/O.
 *
 * Everything is bucketed in Manila time. The Philippines keeps UTC+8 all year,
 * so a fixed offset is exact and far cheaper than formatting every timestamp
 * through Intl. Callers pass paid orders; nothing here re-checks `paid`.
 */

export const DAY_MS = 86_400_000;
const MANILA_OFFSET_MS = 8 * 3_600_000;

/** A timestamp shifted so its UTC fields read as Manila wall-clock time. */
const manila = (at: number) => new Date(at + MANILA_OFFSET_MS);

/** Manila calendar day, "YYYY-MM-DD". */
export const dayKey = (at: number) => manila(at).toISOString().slice(0, 10);

/** Epoch ms of the Manila midnight that starts the day containing `at`. */
export function startOfManilaDay(at: number): number {
  return Math.floor((at + MANILA_OFFSET_MS) / DAY_MS) * DAY_MS - MANILA_OFFSET_MS;
}

/** Epoch ms of Manila midnight on a "YYYY-MM-DD" day. */
export const dayStart = (day: string) => Date.parse(`${day}T00:00:00+08:00`);

/* ------------------------------------------------------------------ */
/* Date ranges                                                         */
/* ------------------------------------------------------------------ */

export const RANGE_KEYS = ["7d", "30d", "90d", "all"] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];

export const RANGE_LABEL: Record<RangeKey, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  all: "All time",
};

const RANGE_DAYS: Record<Exclude<RangeKey, "all">, number> = { "7d": 7, "30d": 30, "90d": 90 };

export const isRangeKey = (value: unknown): value is RangeKey =>
  RANGE_KEYS.includes(value as RangeKey);

export type Window = { from: number; to: number };

export type ResolvedRange = {
  key: RangeKey;
  /** null for "all": the window opens at the first sale. */
  current: Window | null;
  /** The equal-length window just before, for comparisons. null for "all". */
  previous: Window | null;
};

/** Whole Manila days ending today, so "7 days" is today plus the six before. */
export function resolveRange(key: RangeKey, now: number): ResolvedRange {
  if (key === "all") return { key, current: null, previous: null };

  const span = RANGE_DAYS[key] * DAY_MS;
  const to = startOfManilaDay(now) + DAY_MS;
  const from = to - span;
  return { key, current: { from, to }, previous: { from: from - span, to: from } };
}

export const within = (order: Order, window: Window | null) =>
  !window || (order.createdAt >= window.from && order.createdAt < window.to);

/* ------------------------------------------------------------------ */
/* Headline figures                                                    */
/* ------------------------------------------------------------------ */

export type Summary = {
  revenue: number;
  orders: number;
  /** Units sold across every line. */
  items: number;
  /** Average order value, whole pesos. 0 when there are no orders. */
  aov: number;
  itemsPerOrder: number;
  /** Pesos comped by loyalty rewards. */
  comped: number;
};

const unitsOf = (order: Order) => order.items.reduce((sum, line) => sum + line.qty, 0);

export function summarize(orders: Order[]): Summary {
  const revenue = orders.reduce((sum, o) => sum + o.subtotal, 0);
  const items = orders.reduce((sum, o) => sum + unitsOf(o), 0);
  const count = orders.length;
  return {
    revenue,
    orders: count,
    items,
    aov: count ? Math.round(revenue / count) : 0,
    itemsPerOrder: count ? items / count : 0,
    comped: orders.reduce((sum, o) => sum + o.rewardDiscount, 0),
  };
}

/**
 * Change from `before` to `now` as a fraction (0.25 is +25%). null when there
 * is nothing to compare against, which is not the same as no change.
 */
export function change(now: number, before: number | undefined): number | null {
  if (before === undefined || before === 0) return null;
  return (now - before) / before;
}

/* ------------------------------------------------------------------ */
/* Over time                                                           */
/* ------------------------------------------------------------------ */

export type TrendPoint = {
  /** First Manila day of the bucket, "YYYY-MM-DD". */
  day: string;
  revenue: number;
  orders: number;
};

export type Trend = { bucket: "day" | "week"; points: TrendPoint[] };

// Past this many days a daily chart is too dense to read, so bucket by week.
const MAX_DAILY_POINTS = 62;

/**
 * Revenue and order count per day across the window, with empty days filled
 * in so a quiet day shows as a gap rather than vanishing from the axis. With
 * no window, spans the first sale to today.
 */
export function trend(orders: Order[], window: Window | null, now: number): Trend {
  if (orders.length === 0 && !window) return { bucket: "day", points: [] };

  const first = window
    ? window.from
    : startOfManilaDay(Math.min(...orders.map((o) => o.createdAt)));
  const end = window ? window.to : startOfManilaDay(now) + DAY_MS;

  const days = Math.round((end - first) / DAY_MS);
  const size = days > MAX_DAILY_POINTS ? 7 : 1;
  const points: TrendPoint[] = [];
  for (let start = first; start < end; start += size * DAY_MS) {
    points.push({ day: dayKey(start), revenue: 0, orders: 0 });
  }

  for (const order of orders) {
    const index = Math.floor((order.createdAt - first) / (size * DAY_MS));
    const point = points[index];
    if (!point) continue;
    point.revenue += order.subtotal;
    point.orders += 1;
  }

  return { bucket: size === 7 ? "week" : "day", points };
}

const HOUR_MS = 3_600_000;
// A bazaar longer than this reads better by day than by hour.
const MAX_HOURLY_SPAN_MS = 3 * DAY_MS;

export type HourPoint = { at: number; revenue: number; orders: number };

/**
 * Sales per hour from the first sale to the last, quiet hours included: how a
 * short event built up. null when the sales span too long for hours to read
 * well, and the daily `trend` should be used instead.
 */
export function hourlyTrend(orders: Order[]): HourPoint[] | null {
  if (orders.length === 0) return [];

  const times = orders.map((o) => o.createdAt);
  const first = Math.floor(Math.min(...times) / HOUR_MS) * HOUR_MS;
  const last = Math.floor(Math.max(...times) / HOUR_MS) * HOUR_MS;
  if (last - first > MAX_HOURLY_SPAN_MS) return null;

  const points: HourPoint[] = [];
  for (let at = first; at <= last; at += HOUR_MS) points.push({ at, revenue: 0, orders: 0 });
  for (const order of orders) {
    const point = points[Math.floor((order.createdAt - first) / HOUR_MS)];
    point.revenue += order.subtotal;
    point.orders += 1;
  }
  return points;
}

/** Running total of a trend, for a "how the day built up" line. */
export function cumulative<P extends { revenue: number; orders: number }>(points: P[]): P[] {
  let revenue = 0;
  let orders = 0;
  return points.map((point) => {
    revenue += point.revenue;
    orders += point.orders;
    return { ...point, revenue, orders };
  });
}

/** Monday first, the way a shop week is read. */
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/**
 * Orders by weekday (rows, Monday first) and hour of day (columns, 0 to 23):
 * the shape of the rush.
 */
export function rushGrid(orders: Order[]): number[][] {
  const grid = WEEKDAYS.map(() => new Array<number>(24).fill(0));
  for (const order of orders) {
    const at = manila(order.createdAt);
    const weekday = (at.getUTCDay() + 6) % 7;
    grid[weekday][at.getUTCHours()] += 1;
  }
  return grid;
}

/* ------------------------------------------------------------------ */
/* Breakdowns                                                          */
/* ------------------------------------------------------------------ */

export type Slice = {
  key: string;
  label: string;
  revenue: number;
  orders: number;
  /** Share of the total revenue, 0 to 1. */
  share: number;
};

/** Revenue and orders grouped by any key, largest first. */
export function breakdown<T extends Order>(
  orders: T[],
  keyOf: (order: T) => string,
  labelOf: (key: string) => string,
): Slice[] {
  const groups = new Map<string, { revenue: number; orders: number }>();
  for (const order of orders) {
    const key = keyOf(order);
    const group = groups.get(key) ?? { revenue: 0, orders: 0 };
    group.revenue += order.subtotal;
    group.orders += 1;
    groups.set(key, group);
  }

  const total = [...groups.values()].reduce((sum, g) => sum + g.revenue, 0);
  return [...groups.entries()]
    .map(([key, g]) => ({
      key,
      label: labelOf(key),
      ...g,
      share: total ? g.revenue / total : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export type ItemSales = { itemId: string; name: string; qty: number; revenue: number };

const allLines = (orders: Order[]): OrderLine[] => orders.flatMap((o) => o.items);

/** Menu items by units sold. Revenue is before any reward discount. */
export function itemSales(orders: Order[]): ItemSales[] {
  const items = new Map<string, ItemSales>();
  for (const line of allLines(orders)) {
    const row = items.get(line.itemId) ?? { itemId: line.itemId, name: line.name, qty: 0, revenue: 0 };
    row.qty += line.qty;
    row.revenue += line.lineTotal;
    items.set(line.itemId, row);
  }
  return [...items.values()].sort((a, b) => b.qty - a.qty || b.revenue - a.revenue);
}

export type CategorySales = { id: string; name: string; qty: number; revenue: number; share: number };

/** Sales rolled up to menu categories. Items since removed land in "Other". */
export function categorySales(orders: Order[], menu: MenuData): CategorySales[] {
  const categoryOf = new Map(menu.items.map((item) => [item.id, item.categoryId]));
  const nameOf = new Map(menu.categories.map((c) => [c.id, c.name]));

  const groups = new Map<string, { qty: number; revenue: number }>();
  for (const line of allLines(orders)) {
    const id = categoryOf.get(line.itemId) ?? "other";
    const group = groups.get(id) ?? { qty: 0, revenue: 0 };
    group.qty += line.qty;
    group.revenue += line.lineTotal;
    groups.set(id, group);
  }

  const total = [...groups.values()].reduce((sum, g) => sum + g.revenue, 0);
  return [...groups.entries()]
    .map(([id, g]) => ({
      id,
      name: nameOf.get(id) ?? "Other",
      ...g,
      share: total ? g.revenue / total : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export type AddOnSales = { name: string; qty: number; revenue: number };

export type AddOnReport = {
  /** Share of units sold that carried at least one paid add-on, 0 to 1. */
  attachRate: number;
  /** Pesos earned from add-ons alone. */
  revenue: number;
  top: AddOnSales[];
};

/** How often customers upsize or add extras, and which extras earn the most. */
export function addOnReport(orders: Order[]): AddOnReport {
  const addOns = new Map<string, AddOnSales>();
  let units = 0;
  let unitsWithAddOn = 0;

  for (const line of allLines(orders)) {
    const paid = line.groups.flatMap((g) => g.addOns).filter((a) => a.price > 0);
    units += line.qty;
    if (paid.length > 0) unitsWithAddOn += line.qty;
    for (const addOn of paid) {
      const row = addOns.get(addOn.name) ?? { name: addOn.name, qty: 0, revenue: 0 };
      row.qty += line.qty;
      row.revenue += addOn.price * line.qty;
      addOns.set(addOn.name, row);
    }
  }

  const top = [...addOns.values()].sort((a, b) => b.revenue - a.revenue);
  return {
    attachRate: units ? unitsWithAddOn / units : 0,
    revenue: top.reduce((sum, a) => sum + a.revenue, 0),
    top,
  };
}
