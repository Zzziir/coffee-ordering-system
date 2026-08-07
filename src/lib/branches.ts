/**
 * Craffé branches — the single source of truth for every location.
 *
 * Anything that differs between stores lives here: address, hours, which order
 * channels the branch runs, what it calls its collection point, which payments
 * it takes, and its own signage where it has any. Pages read from this module
 * rather than hardcoding a location, so opening a third Craffé is a new record
 * and nothing else.
 *
 * Menu is deliberately NOT here — all branches share one catalog at one set of
 * prices. A branch that doesn't carry an item marks it via `unavailableAt` on
 * the item itself (see ./menu).
 */

import type { BranchId, OrderChannel, PaymentMethod } from "./types";
import { CHANNEL_LABEL, PAYMENT_LABEL } from "./types";

/** Opening window for one weekday. `null` means closed that day. */
export type DayHours = { open: string; close: string } | null;

/** Indexed by `Date#getDay()` — 0 is Sunday. */
export type WeekHours = [
  DayHours,
  DayHours,
  DayHours,
  DayHours,
  DayHours,
  DayHours,
  DayHours,
];

export type Branch = {
  id: BranchId;
  /** short name for the picker, header chip, and staff screen */
  name: string;
  /** the lockup as it reads on the building, when it differs from plain Craffé */
  lockupName: string;
  /** the branch's own mark, shown at branch touchpoints. null = shared Craffé mark. */
  logo: string | null;
  addressLine: string;
  city: string;
  mapsUrl: string;
  phone?: string;
  instagram?: string;
  /** prefixes every pickup code here, so two branches never call the same one */
  codePrefix: string;
  /** which order channels this branch actually runs, in the order they're offered */
  channels: OrderChannel[];
  /** where an `onsite` order is collected — "window" or "counter" */
  pickupNoun: string;
  payments: PaymentMethod[];
  hours: WeekHours;
  /** one line under the branch name in the picker */
  blurb: string;
};

const MAPS = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export const BRANCHES: Record<BranchId, Branch> = {
  "east-rembo": {
    id: "east-rembo",
    name: "East Rembo",
    lockupName: "Craffé",
    logo: null,
    addressLine: "15th Ave JP Rizal Ext.",
    city: "Makati City",
    mapsUrl: MAPS("Craffe East Rembo 15th Ave JP Rizal Ext Makati"),
    codePrefix: "R",
    channels: ["dinein", "onsite", "pickup"],
    pickupNoun: "window",
    payments: ["gcash", "maya", "card", "cash"],
    hours: [
      { open: "07:30", close: "24:00" }, // Sun
      { open: "07:30", close: "23:00" }, // Mon
      { open: "07:30", close: "23:00" },
      { open: "07:30", close: "23:00" },
      { open: "07:30", close: "23:00" }, // Thu
      { open: "07:30", close: "24:00" }, // Fri
      { open: "07:30", close: "24:00" }, // Sat
    ],
    blurb: "The original, on 15th Ave",
  },

  mycc: {
    id: "mycc",
    name: "MYCC",
    lockupName: "Craffé by MYCC",
    logo: "/brand/mycc-lockup.png",
    addressLine: "Marilao",
    city: "Bulacan",
    mapsUrl: MAPS("Craffe by MYCC Marilao"),
    phone: "0976 460 8430",
    instagram: "craffe.mycc",
    codePrefix: "M",
    channels: ["dinein", "onsite", "pickup"],
    pickupNoun: "counter",
    // Their page lists cash, GCash and Maya — no card terminal.
    payments: ["gcash", "maya", "cash"],
    hours: [
      { open: "14:00", close: "23:00" }, // Sun
      { open: "13:00", close: "22:00" }, // Mon
      { open: "13:00", close: "22:00" },
      { open: "13:00", close: "22:00" },
      { open: "13:00", close: "22:00" }, // Thu
      { open: "15:00", close: "24:00" }, // Fri
      { open: "14:00", close: "23:00" }, // Sat
    ],
    blurb: "Aircon, pet friendly, WiFi",
  },
};

/** Every branch, in the order they should appear in the picker and on Contact. */
export const BRANCH_LIST: Branch[] = [BRANCHES["east-rembo"], BRANCHES.mycc];

export const DEFAULT_BRANCH_ID: BranchId = "east-rembo";

/**
 * Guards untrusted input — the `?b=` link param and the order POST body.
 * Uses hasOwn, not `in`: `"toString" in BRANCHES` is true via the prototype.
 */
export function isBranchId(value: unknown): value is BranchId {
  return typeof value === "string" && Object.hasOwn(BRANCHES, value);
}

export function getBranch(id: BranchId): Branch {
  return BRANCHES[id];
}

/**
 * The branch's full name in prose — "Craffé East Rembo", "Craffé by MYCC".
 *
 * Use this wherever branches are listed together, where a bare "Craffé" would
 * be ambiguous. At a single-branch touchpoint use `lockupName` instead: that's
 * the name over that door, and the point of the co-branding.
 */
export function branchFullName(branch: Branch): string {
  return branch.lockupName === "Craffé" ? `Craffé ${branch.name}` : branch.lockupName;
}

/** Address on one line, without repeating itself when the two fields agree. */
export function branchAddress(branch: Branch): string {
  return branch.addressLine === branch.city
    ? branch.city
    : `${branch.addressLine}, ${branch.city}`;
}

/* ------------------------------------------------------------------ */
/* Opening hours                                                       */
/* ------------------------------------------------------------------ */

/** Every branch is in the Philippines; the server may not be. */
const TIME_ZONE = "Asia/Manila";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Local weekday + minutes-past-midnight in Manila, wherever this runs. */
export function manilaNow(at: Date = new Date()): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(at);

  const lookup = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  // Intl renders midnight as "24" in some runtimes; normalise to 0.
  const hour = Number(lookup("hour")) % 24;

  return {
    day: WEEKDAY_INDEX[lookup("weekday")] ?? 0,
    minutes: hour * 60 + Number(lookup("minute")),
  };
}

export function isOpen(branch: Branch, at: Date = new Date()): boolean {
  const { day, minutes } = manilaNow(at);
  const today = branch.hours[day];
  if (!today) return false;
  return minutes >= toMinutes(today.open) && minutes < toMinutes(today.close);
}

function formatTime(hhmm: string): string {
  const total = toMinutes(hhmm) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const suffix = h < 12 ? "am" : "pm";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12}${suffix}` : `${hour12}:${String(m).padStart(2, "0")}${suffix}`;
}

/**
 * Short status for the picker and header chip:
 * "Open until 11pm" / "Opens 1pm" / "Opens Tue 1pm".
 */
export function openStatusLabel(branch: Branch, at: Date = new Date()): string {
  const { day, minutes } = manilaNow(at);
  const today = branch.hours[day];

  if (today && minutes < toMinutes(today.open)) {
    return `Opens ${formatTime(today.open)}`;
  }
  if (today && minutes < toMinutes(today.close)) {
    return `Open until ${formatTime(today.close)}`;
  }

  // Closed for the day — find the next day that opens.
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let step = 1; step <= 7; step++) {
    const next = branch.hours[(day + step) % 7];
    if (next) {
      const label = step === 1 ? "tomorrow" : names[(day + step) % 7];
      return `Opens ${label} ${formatTime(next.open)}`;
    }
  }
  return "Closed";
}

/**
 * Hours collapsed into contiguous runs for display, e.g.
 * ["Mon–Thu · 7:30am – 11pm", "Fri–Sun · 7:30am – 12am"].
 */
export function hoursSummary(branch: Branch): string[] {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // Read the week starting Monday — how Filipinos read a shop sign.
  const order = [1, 2, 3, 4, 5, 6, 0];
  const key = (d: DayHours) => (d ? `${d.open}-${d.close}` : "closed");

  const runs: { from: number; to: number; hours: DayHours }[] = [];
  for (const day of order) {
    const hours = branch.hours[day];
    const last = runs[runs.length - 1];
    if (last && key(last.hours) === key(hours)) {
      last.to = day;
    } else {
      runs.push({ from: day, to: day, hours });
    }
  }

  return runs.map(({ from, to, hours }) => {
    const span =
      runs.length === 1
        ? "Every day"
        : from === to
          ? names[from]
          : `${names[from]}–${names[to]}`;
    if (!hours) return `${span} · Closed`;
    return `${span} · ${formatTime(hours.open)} – ${formatTime(hours.close)}`;
  });
}

/**
 * Every branch as plain text for the chatbot's system prompt, so it can answer
 * "where are you?" correctly instead of telling a Marilao customer it's in
 * Makati. Mirrors `menuForPrompt` in ./menu.
 */
export function branchesForPrompt(): string {
  return BRANCH_LIST.map((branch) => {
    const channels = branch.channels
      .map((c) => CHANNEL_LABEL[c].toLowerCase())
      .join(", ");
    const payments = branch.payments.map((p) => PAYMENT_LABEL[p]).join(", ");
    return [
      `- ${branchFullName(branch)} — ${branchAddress(branch)}`,
      `  Hours: ${hoursSummary(branch).join(" | ")}`,
      `  Service: ${channels}; orders are collected at the ${branch.pickupNoun}`,
      `  Payments accepted: ${payments}`,
    ].join("\n");
  }).join("\n");
}
