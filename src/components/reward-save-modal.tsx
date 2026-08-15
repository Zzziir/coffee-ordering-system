"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { GiftIcon, SealWarningIcon } from "@phosphor-icons/react";
import { CupMark } from "./brand";

/**
 * Shown once, right after a guest places an order: the stamps they just earned
 * live only on this device and are one cleared browser away from gone. The copy
 * leans on that to make signing up the obvious move — an account keeps the
 * progress and unlocks redeeming it.
 */
export function RewardSaveModal({
  open,
  stamps,
  onCreateAccount,
  onSignIn,
  onDismiss,
}: {
  open: boolean;
  stamps: number;
  onCreateAccount: () => void;
  onSignIn: () => void;
  onDismiss: () => void;
}) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onDismiss();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onDismiss]);

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
            aria-label="Not now"
            onClick={onDismiss}
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reward-save-title"
            className="relative w-full max-w-sm overflow-hidden rounded-[var(--radius-lg)] border border-line bg-paper shadow-[var(--shadow-sheet)]"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="flex flex-col items-center gap-3 bg-ink px-6 pb-6 pt-7 text-center text-paper">
              <span className="grid size-12 place-items-center rounded-full bg-coffee text-paper">
                <GiftIcon size={24} weight="fill" />
              </span>
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-paper/70">
                <CupMark className="size-4 text-paper" />
                Craffé Rewards
              </div>
              <h2 id="reward-save-title" className="text-[20px] font-bold tracking-tight">
                {stamps > 0
                  ? `Don't lose your ${stamps} ${stamps === 1 ? "stamp" : "stamps"}`
                  : "Save your rewards"}
              </h2>
            </div>

            <div className="px-6 pb-6 pt-5">
              <div className="flex items-start gap-2.5 rounded-[var(--radius-md)] bg-coffee-tint/60 px-3.5 py-3 text-[13px] text-ink-soft">
                <SealWarningIcon size={18} weight="fill" className="mt-px shrink-0 text-coffee" />
                <p>
                  Stamps earned as a guest stay on this device only. Clear your
                  browser or switch phones and they are gone. An account keeps
                  every stamp and lets you redeem free drinks.
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={onCreateAccount}
                  className="pressable flex h-12 items-center justify-center rounded-full bg-ink text-[15px] font-semibold text-paper"
                >
                  Create a free account
                </button>
                <button
                  type="button"
                  onClick={onSignIn}
                  className="pressable flex h-12 items-center justify-center rounded-full border border-line bg-paper text-[15px] font-semibold text-ink"
                >
                  I already have an account
                </button>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="pressable mt-0.5 h-9 text-[14px] font-medium text-ink-faint"
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
