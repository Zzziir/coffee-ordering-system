"use client";

import { useOptimistic, useTransition } from "react";
import { moveOrder } from "../events/actions";

const STORE_SALE = "";

/**
 * Says where a sale was made and lets an admin correct it: any event, or a
 * plain store sale. Optimistic, like the inquiry status control.
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
  const [optimistic, setOptimistic] = useOptimistic(eventId ?? STORE_SALE);
  const [pending, startTransition] = useTransition();

  return (
    <select
      aria-label={`Where order ${orderCode} was sold`}
      value={optimistic}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          setOptimistic(next);
          await moveOrder(orderId, next || null);
        });
      }}
      className="h-9 max-w-[11rem] truncate rounded-full border border-line bg-paper px-3 text-[13px] font-medium text-ink outline-none transition-colors focus:border-coffee disabled:opacity-60"
    >
      <option value={STORE_SALE}>Store sale</option>
      {events.map((event) => (
        <option key={event.id} value={event.id}>
          {event.name}
        </option>
      ))}
    </select>
  );
}
