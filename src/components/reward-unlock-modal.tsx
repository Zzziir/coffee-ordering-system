"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import confetti from "canvas-confetti";
import { GiftIcon } from "@phosphor-icons/react";
import { CupMark } from "./brand";
import { ackRewardCelebration } from "@/lib/reward-actions";

/** A gold-and-coffee burst, once, the moment a card is completed. */
function burst() {
  const defaults = {
    spread: 360,
    ticks: 60,
    gravity: 0,
    decay: 0.93,
    startVelocity: 32,
    colors: ["#8a6a47", "#cba071", "#eee6db", "#f6f3ec", "#FFBD00"],
  };
  confetti({ ...defaults, particleCount: 44, scalar: 1.2, shapes: ["circle"] });
  confetti({ ...defaults, particleCount: 14, scalar: 0.8, shapes: ["star"] });
}

/**
 * Celebrates the instant a customer's lifetime rewards-earned count ticks up —
 * i.e. an order they placed has been picked up and completed a card. Signed-in
 * only, tracked server-side so it fires exactly once per account across devices.
 *
 * `earnedRewards` is the lifetime count; `celebrated` is what's already been
 * acknowledged (null the first time we ever see this account). The first sight
 * banks the count silently; any later increase cheers once, then acks.
 */
export function RewardUnlockModal({
  earnedRewards,
  celebrated,
  free,
}: {
  earnedRewards: number;
  celebrated: number | null;
  free: number;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);

  const shouldCelebrate = celebrated !== null && earnedRewards > celebrated;
  const needsAck = celebrated === null || earnedRewards > celebrated;

  useEffect(() => {
    // Persist the new high-water mark (silently on first sight, or after a win).
    if (needsAck) void ackRewardCelebration(earnedRewards);
    if (shouldCelebrate) setOpen(true);
    // Re-run only when the underlying counts change.
  }, [earnedRewards, celebrated, needsAck, shouldCelebrate]);

  useEffect(() => {
    if (open && !reduce) burst();
  }, [open, reduce]);

  const dismiss = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, dismiss]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Maybe later"
            onClick={dismiss}
            className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reward-unlock-title"
            className="relative w-full max-w-sm overflow-hidden rounded-[var(--radius-lg)] border border-line bg-ink text-paper shadow-[var(--shadow-sheet)]"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
              <motion.span
                className="grid size-16 place-items-center rounded-full bg-coffee text-paper"
                initial={reduce ? false : { scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0.05 }}
              >
                <GiftIcon size={32} weight="fill" />
              </motion.span>

              <div className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-paper/70">
                <CupMark className="size-4 text-paper" />
                Craffé Rewards
              </div>

              <h2
                id="reward-unlock-title"
                className="mt-2 text-[22px] font-bold tracking-tight"
              >
                Free drink unlocked!
              </h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-paper/70">
                {free > 1
                  ? `You completed a rewards card. That's ${free} free drinks waiting for you.`
                  : "You completed a rewards card. Your next drink is on us."}
              </p>

              <div className="mt-6 flex w-full flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => router.push("/menu")}
                  className="pressable flex h-12 items-center justify-center rounded-full bg-coffee text-[15px] font-semibold text-paper"
                >
                  Order now
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="pressable h-10 text-[14px] font-medium text-paper/60"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
