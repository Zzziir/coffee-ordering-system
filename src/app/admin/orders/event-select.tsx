"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast";
import { moveOrder } from "../events/actions";

const STORE_SALE = "";

/**
 * Says where a sale was made and lets an admin correct it: any event, or a
 * plain store sale. Moving a sale changes two reports at once and a select is
 * easy to nudge by accident, so the change is confirmed before it is made.
 */
export function EventSelect({
  orderId,
  orderCode,
  eventId,
  events,
}: {
  orderId: string;
  orderCode: string;
  eventId: string | null;
  events: { id: string; name: string }[];
}) {
  const toast = useToast();
  const [optimistic, setOptimistic] = useOptimistic(eventId ?? STORE_SALE);
  const [pending, startTransition] = useTransition();
  // The destination waiting on a yes. null means no dialog.
  const [target, setTarget] = useState<string | null>(null);

  const nameOf = (id: string) =>
    id === STORE_SALE ? "the store" : (events.find((e) => e.id === id)?.name ?? "that event");

  const move = () => {
    if (target === null) return;
    const next = target;
    startTransition(async () => {
      setOptimistic(next);
      setTarget(null);
      try {
        await moveOrder(orderId, next || null);
        toast.success(`${orderCode} moved to ${nameOf(next)}.`);
      } catch {
        toast.error(`Couldn't move ${orderCode}. Try again.`);
      }
    });
  };

  return (
    <>
      <select
        aria-label={`Where order ${orderCode} was sold`}
        value={optimistic}
        disabled={pending}
        onChange={(e) => setTarget(e.target.value)}
        className="h-9 max-w-[11rem] truncate rounded-full border border-line bg-paper px-3 text-[13px] font-medium text-ink outline-none transition-colors focus:border-coffee disabled:opacity-60"
      >
        <option value={STORE_SALE}>Store sale</option>
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.name}
          </option>
        ))}
      </select>

      <ConfirmDialog
        open={target !== null}
        title={`Move ${orderCode} to ${nameOf(target ?? STORE_SALE)}?`}
        confirmLabel="Move sale"
        onConfirm={move}
        onCancel={() => setTarget(null)}
      >
        It will count toward {nameOf(target ?? STORE_SALE)} instead of {nameOf(optimistic)} in the
        sales reports. You can move it back at any time.
      </ConfirmDialog>
    </>
  );
}
