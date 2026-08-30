"use client";

import { useOptimistic, useTransition } from "react";
import { clsx } from "@/lib/clsx";
import { INQUIRY_STATUSES, type InquiryStatus } from "@/lib/inquiries";
import { updateInquiryStatus } from "./actions";

const LABEL: Record<InquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  closed: "Closed",
};

/**
 * Triage buttons for one lead. Optimistic: the pill fills the instant it's
 * pressed, then the server catches up. Reverts if the update throws.
 */
export function StatusControl({ id, status }: { id: string; status: InquiryStatus }) {
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [, startTransition] = useTransition();

  return (
    <div
      role="group"
      aria-label="Lead status"
      className="flex gap-1 rounded-full border border-line bg-paper-sunk p-0.5"
    >
      {INQUIRY_STATUSES.map((s) => {
        const active = s === optimistic;
        return (
          <button
            key={s}
            type="button"
            aria-pressed={active}
            disabled={active}
            onClick={() =>
              startTransition(async () => {
                setOptimistic(s);
                await updateInquiryStatus(id, s);
              })
            }
            className={clsx(
              "pressable rounded-full px-3 py-1 text-[12.5px] font-medium transition-colors",
              active
                ? "bg-ink text-paper"
                : "text-ink-soft hover:bg-paper-raised hover:text-ink",
            )}
          >
            {LABEL[s]}
          </button>
        );
      })}
    </div>
  );
}
