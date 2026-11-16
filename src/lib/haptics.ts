/**
 * A buzz for something that actually happened: an item went into the bag, an
 * order went through, a change was saved. Never for a plain tap, a scroll or
 * opening a sheet, so the buzz keeps meaning "done".
 *
 * Android only in practice: Safari on iPhone has no vibration API, so this
 * quietly does nothing there.
 */
const PATTERNS = {
  /** a small change landed: item added, ticket moved, switch saved */
  confirm: 12,
  /** a big moment: the order is placed */
  success: [18, 70, 28],
  /** the order being tracked is ready at the counter */
  ready: [40, 60, 40],
  /** the order is picked up: the end of the trip */
  celebrate: [20, 40, 20, 40, 60],
} satisfies Record<string, number | number[]>;

export function haptic(kind: keyof typeof PATTERNS) {
  if (typeof navigator === "undefined") return;
  try {
    navigator.vibrate?.(PATTERNS[kind]);
  } catch {
    // Blocked by the browser (no user gesture yet, or vibration disabled).
  }
}
