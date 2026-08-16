"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { CoffeeIcon, GiftIcon } from "@phosphor-icons/react";
import { CupMark } from "./brand";
import { STAMPS_PER_REWARD } from "@/lib/menu";
import { clsx } from "@/lib/clsx";

const STAMP_KEY = "craffe.stamps";
const CUPS = STAMPS_PER_REWARD - 1; // nine cups, then the reward slot

// Diagonal coffee hatch for "on the way" stamps: earned but not yet credited,
// because the order that will earn them hasn't been paid for (a cash order is
// paid at pickup). Distinct from a solid earned stamp and an empty ring.
const HATCH =
  "repeating-linear-gradient(45deg, color-mix(in srgb, var(--color-coffee) 65%, transparent) 0 2px, transparent 2px 7px)";

/**
 * Digital "10 stamps, 1 free drink" card.
 *
 * Signed-in customers pass a server-computed `stamps` count (one per drink they
 * have bought) and `free` (rewards they can redeem now). With no props it falls
 * back to the guest tally in localStorage — how it renders for people who
 * haven't made an account, where free drinks are simply derived from the count.
 *
 * On an order confirmation, `earnedThisOrder` calls out how many stamps that one
 * order just added. `pending` previews stamps a customer will get once an order
 * is paid for (hatched slots), so a cash order in progress still shows up.
 */
export function StampCard({
  stamps: stampsProp,
  free: freeProp,
  earnedThisOrder,
  pending: pendingProp,
}: {
  stamps?: number;
  free?: number;
  earnedThisOrder?: number;
  pending?: number;
} = {}) {
  const [localStamps, setLocalStamps] = useState<number | null>(null);
  const stamps = stampsProp ?? localStamps;

  useEffect(() => {
    // When the count is supplied by the server, ignore local storage entirely.
    if (stampsProp !== undefined) return;
    const read = () => {
      try {
        setLocalStamps(Number(localStorage.getItem(STAMP_KEY) || "0"));
      } catch {
        setLocalStamps(0);
      }
    };
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, [stampsProp]);

  const filled = stamps ?? 0;
  const progress = filled % STAMPS_PER_REWARD; // 0..9 on the current card
  const free = freeProp ?? Math.floor(filled / STAMPS_PER_REWARD);
  const remaining = STAMPS_PER_REWARD - progress; // drinks until the next free one
  // Pending stamps fill the slots right after the earned ones. They can reach
  // the reward slot when they'd complete the current card; the caption always
  // states the true count, even if it spills beyond this one card.
  const pendingRaw = Math.max(0, pendingProp ?? 0);
  const pendingCups = Math.min(pendingRaw, CUPS - progress);
  const pendingReward = free === 0 && pendingRaw >= STAMPS_PER_REWARD - progress;
  const showEarned = earnedThisOrder != null && earnedThisOrder > 0;
  const showPending = !showEarned && pendingRaw > 0;

  // When the stamp count grows after the card is on screen — e.g. an order is
  // picked up live — the newly earned cups cascade in. On first paint nothing
  // animates (mounted is still false), so an already-filled card sits still.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const prevFilledRef = useRef(filled);
  useEffect(() => {
    prevFilledRef.current = filled;
  }, [filled]);
  const prevFilled = prevFilledRef.current;
  const grew = filled > prevFilled;
  const wrapped =
    Math.floor(filled / STAMPS_PER_REWARD) > Math.floor(prevFilled / STAMPS_PER_REWARD);
  const fillFrom = wrapped ? 0 : prevFilled % STAMPS_PER_REWARD;

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-ink text-paper">
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2">
          <CupMark className="size-5 text-paper" />
          <span className="text-[14px] font-semibold tracking-wide">
            Craffé Rewards
          </span>
        </div>
        {free > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-paper/15 px-2.5 py-1 text-[12px] font-medium">
            <GiftIcon size={13} weight="fill" />
            {free} free
          </span>
        )}
      </div>

      {showEarned && (
        <p className="flex items-center gap-1.5 px-5 pt-2 text-[13.5px] font-semibold text-paper">
          <CoffeeIcon size={14} weight="fill" />
          {`+${earnedThisOrder} ${earnedThisOrder === 1 ? "stamp" : "stamps"} from this order`}
        </p>
      )}
      {showPending && (
        <p className="flex items-center gap-1.5 px-5 pt-2 text-[13.5px] font-semibold text-paper">
          <CoffeeIcon size={14} weight="fill" />
          {`${pendingRaw} ${pendingRaw === 1 ? "stamp" : "stamps"} on the way`}
        </p>
      )}

      <p
        className={clsx(
          "px-5 text-[13.5px] text-paper/70",
          showEarned || showPending ? "pt-1" : "pt-2",
        )}
      >
        {free > 0
          ? `You've earned ${free} free ${free === 1 ? "drink" : "drinks"}. Redeem ${free === 1 ? "it" : "one"} on your next order.`
          : `${remaining} more ${remaining === 1 ? "drink" : "drinks"} until a free one.`}
      </p>

      <div className="grid grid-cols-5 gap-2.5 p-5">
        {Array.from({ length: STAMPS_PER_REWARD }).map((_, i) => {
          const isReward = i === CUPS;
          const earned = !isReward && i < progress;
          const isPending = isReward
            ? pendingReward
            : i >= progress && i < progress + pendingCups;
          const active = isReward ? free > 0 : earned;
          // A cup (or the reward) that just became active this update pops in,
          // cups left to right in the freshly filled run.
          const justFilled =
            mounted && grew && !isReward && earned && i >= fillFrom && i < progress;
          const rewardJustLit = mounted && grew && isReward && active && wrapped;
          const animateIn = justFilled || rewardJustLit;
          return (
            <div
              key={i}
              style={isPending ? { backgroundImage: HATCH } : undefined}
              className={clsx(
                "relative grid aspect-square place-items-center rounded-full border transition-colors duration-300",
                isReward ? "border-dashed" : "",
                active
                  ? "border-transparent bg-coffee text-paper"
                  : isPending
                    ? "border-coffee/50 text-paper/70"
                    : "border-paper/25 text-paper/30",
              )}
            >
              {active && stamps !== null ? (
                <motion.span
                  initial={animateIn ? { scale: 0.3, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.35,
                    ease: [0.23, 1, 0.32, 1],
                    delay: justFilled ? (i - fillFrom) * 0.1 : 0,
                  }}
                >
                  {isReward ? <GiftIcon size={18} weight="fill" /> : <CoffeeIcon size={18} weight="fill" />}
                </motion.span>
              ) : isReward ? (
                <GiftIcon size={18} weight="regular" />
              ) : (
                <CoffeeIcon size={16} weight="regular" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
