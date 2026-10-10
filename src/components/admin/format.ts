import { dayStart } from "@/lib/analytics";

/** Formatting shared by the back office reports. Everything is Manila time. */

const TZ = "Asia/Manila";

const dayFmt = new Intl.DateTimeFormat("en-PH", { timeZone: TZ, month: "short", day: "numeric" });
const dayYearFmt = new Intl.DateTimeFormat("en-PH", {
  timeZone: TZ,
  month: "short",
  day: "numeric",
  year: "numeric",
});
const weekdayFmt = new Intl.DateTimeFormat("en-PH", {
  timeZone: TZ,
  weekday: "short",
  month: "short",
  day: "numeric",
});
const stampFmt = new Intl.DateTimeFormat("en-PH", {
  timeZone: TZ,
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const hourFmt = new Intl.DateTimeFormat("en-PH", { timeZone: TZ, weekday: "short", hour: "numeric" });

/** "Aug 15" from a timestamp or a "YYYY-MM-DD" day. */
export const shortDay = (at: number | string) =>
  dayFmt.format(typeof at === "string" ? dayStart(at) : at);

/** "Sat, Aug 15" */
export const weekdayDay = (day: string) => weekdayFmt.format(dayStart(day));

/** "Aug 15, 2026" */
export const fullDay = (at: number | string) =>
  dayYearFmt.format(typeof at === "string" ? dayStart(at) : at);

/** "Aug 15, 2:30 PM" */
export const stamp = (at: number) => stampFmt.format(at);

/** "Sat 2 PM" */
export const weekdayHour = (at: number) => hourFmt.format(at);

/** "42%" from a 0 to 1 fraction. */
export const percent = (fraction: number) => `${Math.round(fraction * 100)}%`;

export const plural = (count: number, one: string, many = `${one}s`) =>
  `${count.toLocaleString("en-PH")} ${count === 1 ? one : many}`;

/** "Aug 15 to 17, 2026", "Aug 15, 2026", or a note that no dates are set. */
export function dateSpan(startsOn: string | null, endsOn: string | null): string {
  const first = startsOn ?? endsOn;
  const last = endsOn ?? startsOn;
  if (!first || !last) return "Dates not set";
  if (first === last) return fullDay(first);
  return `${shortDay(first)} to ${fullDay(last)}`;
}

/** How long ago, in the coarse terms a shop owner thinks in. */
export function ago(at: number, now: number): string {
  const days = Math.floor((now - at) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

/** A URL with some query params replaced. Empty values are dropped. */
export function hrefWith(
  path: string,
  current: Record<string, string | undefined>,
  patch: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
