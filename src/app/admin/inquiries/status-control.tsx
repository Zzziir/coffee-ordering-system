"use client";

import { useOptimistic, useTransition } from "react";
import { ArrowCounterClockwiseIcon, ChatCircleTextIcon, CheckIcon } from "@phosphor-icons/react";
import { clsx } from "@/lib/clsx";
import { useToast } from "@/components/toast";
import type { InquiryStatus } from "@/lib/inquiries";
import { updateInquiryStatus } from "./actions";

const LABEL: Record<InquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  closed: "Closed",
};

const BADGE: Record<InquiryStatus, string> = {
  new: "bg-coffee-tint text-coffee",
  contacted: "bg-ready-tint text-ready",
  closed: "bg-paper-sunk text-ink-faint",
};

type Step = { to: InquiryStatus; label: string; icon: React.ReactNode };

/**
 * A lead moves one way: new, then contacted, then closed. So the card offers
 * the next step as its one button rather than every status at once. A new lead
 * that goes nowhere (spam, a wrong number) can skip straight to closed, and a
 * closed one can be picked back up.
 */
const NEXT: Record<InquiryStatus, { primary?: Step; secondary?: Step }> = {
  new: {
    primary: { to: "contacted", label: "Mark contacted", icon: <ChatCircleTextIcon size={15} weight="bold" /> },
    secondary: { to: "closed", label: "Close", icon: null },
  },
  contacted: {
    primary: { to: "closed", label: "Close lead", icon: <CheckIcon size={15} weight="bold" /> },
  },
  closed: {
    secondary: { to: "contacted", label: "Reopen", icon: <ArrowCounterClockwiseIcon size={14} weight="bold" /> },
  },
};

/**
 * Where a lead stands, and the move that usually comes next. Optimistic: the
 * badge changes the instant it's pressed, then a toast confirms it; if the
 * update fails it reverts and the toast says so.
 */
export function StatusControl({
  id,
  name,
  status,
}: {
  id: string;
  /** Who the lead is from, for the confirmation. */
  name: string;
  status: InquiryStatus;
}) {
  const toast = useToast();
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [pending, startTransition] = useTransition();
  const { primary, secondary } = NEXT[optimistic];

  const move = (to: InquiryStatus) =>
    startTransition(async () => {
      setOptimistic(to);
      try {
        await updateInquiryStatus(id, to);
        toast.success(`${name} marked ${LABEL[to].toLowerCase()}.`);
      } catch {
        toast.error("Couldn't update that lead. Try again.");
      }
    });

  return (
    <div className="flex items-center gap-2">
      <span
        className={clsx(
          "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-semibold transition-colors",
          BADGE[optimistic],
        )}
      >
        <span aria-hidden className="size-1.5 rounded-full bg-current" />
        {LABEL[optimistic]}
      </span>
      {secondary && (
        <button
          type="button"
          disabled={pending}
          onClick={() => move(secondary.to)}
          className="pressable inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-ink-soft transition-colors hover:bg-paper-sunk hover:text-ink disabled:opacity-60"
        >
          {secondary.icon}
          {secondary.label}
        </button>
      )}
      {primary && (
        <button
          type="button"
          disabled={pending}
          onClick={() => move(primary.to)}
          className="pressable inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[13px] font-semibold text-paper disabled:opacity-60"
        >
          {primary.icon}
          {primary.label}
        </button>
      )}
    </div>
  );
}
