"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import confetti from "canvas-confetti";
import { GiftIcon } from "@phosphor-icons/react";
import { CupMark } from "./brand";

// Per-device memory of the reward count we've already celebrated, so completing
// a card cheers once and never nags a customer who's just holding rewards.
const ACK_KEY = "craffe.rewards.ack";

function readAck(): number | null {
  try {
    const raw = localStorage.getItem(ACK_KEY);
    return raw === null ? null : Number(raw);
  } catch {
    return null;
  }
}

function writeAck(value: number) {
  try {
    localStorage.setItem(ACK_KEY, String(value));
  } catch {
    /* private mode — worst case the celebration repeats next visit */
  }
}

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
 * Celebrates the instant a customer completes a rewards card, i.e. their free
 * count ticks up. Signed-in only: `free` is the server-derived balance. The
 * first time we see a customer we bank their count silently so we cheer future
 * completions, never one they already had.
 */
export function RewardUnlockModal({ free }: { free: number }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const ack = readAck();
    if (ack === null) {
      writeAck(free); // establish a baseline without cheering
      return;
    }
    if (free > ack) {
      setOpen(true);
    } else if (free < ack) {
      writeAck(free); // they redeemed — keep the baseline honest
    }
  }, [free]);

  useEffect(() => {
    if (open && !reduce) burst();
  }, [open, reduce]);

  const dismiss = useCallback(() => {
    writeAck(free);
    setOpen(false);
  }, [free]);

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

  const orderNow = () => {
    writeAck(free);
    router.push("/menu");
  };

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
                  onClick={orderNow}
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
