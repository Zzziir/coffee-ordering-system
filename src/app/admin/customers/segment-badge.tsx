import { SEGMENT_HINT, SEGMENT_LABEL, type Segment } from "@/lib/crm";
import { clsx } from "@/lib/clsx";

// Three tones, not six: thriving, needs attention, and neutral. The label
// carries the exact segment, so colour only has to say which way to lean.
const TONE: Record<Segment, string> = {
  loyal: "bg-ready-tint text-ready",
  repeat: "bg-ready-tint text-ready",
  new: "bg-coffee-tint text-coffee-deep",
  "at-risk": "bg-warn/15 text-warn",
  lapsed: "bg-warn/15 text-warn",
  "no-orders": "bg-paper-sunk text-ink-soft",
};

export function SegmentBadge({ segment }: { segment: Segment }) {
  return (
    <span
      title={SEGMENT_HINT[segment]}
      className={clsx(
        "inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold",
        TONE[segment],
      )}
    >
      {SEGMENT_LABEL[segment]}
    </span>
  );
}
