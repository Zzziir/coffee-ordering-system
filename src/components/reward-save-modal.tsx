"use client";

import { GiftIcon, SealWarningIcon } from "@phosphor-icons/react";
import { CupMark } from "./brand";
import { Sheet } from "./sheet";

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
  return (
    <Sheet
      open={open}
      onClose={onDismiss}
      labelledBy="reward-save-title"
      placement="center"
      className="max-w-sm overflow-hidden rounded-[var(--radius-lg)] border border-line bg-paper shadow-[var(--shadow-sheet)]"
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
            className="pressable tap-44 mt-0.5 h-9 text-[14px] font-medium text-ink-faint"
          >
            Maybe later
          </button>
        </div>
      </div>
    </Sheet>
  );
}
