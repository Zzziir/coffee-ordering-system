"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { CaretRightIcon } from "@phosphor-icons/react";
import { getBranch } from "@/lib/branches";
import { STATUS_LABEL, type Order, type OrderStatus } from "@/lib/types";
import { useOrderStream } from "./use-order-stream";
import { clsx } from "@/lib/clsx";

// The stages an order moves through before it's picked up. Picked-up orders
// aren't active, so they never appear here.
const ACTIVE_STEPS: OrderStatus[] = ["received", "preparing", "ready"];

/**
 * A signed-in customer's in-progress orders, surfaced on their account so they
 * can jump straight back to tracking. Each card streams live, so a status moves
 * from "Preparing" to "Ready" on its own, and an order drops off the moment it's
 * marked picked up.
 */
export function ActiveOrders({ initial }: { initial: Order[] }) {
  const [byId, setById] = useState<Record<string, Order>>(() =>
    Object.fromEntries(initial.map((o) => [o.id, o])),
  );

  const update = useCallback(
    (o: Order) => setById((prev) => ({ ...prev, [o.id]: o })),
    [],
  );

  // Keep the server's ordering (newest first); drop anything now picked up.
  const active = initial
    .map((o) => byId[o.id] ?? o)
    .filter((o) => o.status !== "completed");

  if (active.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-[15px] font-semibold text-ink">
        {active.length > 1 ? "Active orders" : "Active order"}
      </h2>
      <div className="mt-3 flex flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {active.map((order) => (
            <ActiveOrderRow key={order.id} order={order} onUpdate={update} />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

function ActiveOrderRow({
  order,
  onUpdate,
}: {
  order: Order;
  onUpdate: (o: Order) => void;
}) {
  // One broadcast subscription per active order; it unsubscribes when the order
  // is picked up and this row unmounts.
  useOrderStream({ order: order.id }, onUpdate);

  const branch = getBranch(order.branchId);
  const count = order.items.reduce((n, l) => n + l.qty, 0);
  const step = ACTIVE_STEPS.indexOf(order.status);
  const isReady = order.status === "ready";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
    >
      <Link
        href={`/order/${order.id}`}
        className={clsx(
          "pressable block rounded-[var(--radius-md)] border bg-paper-raised p-4",
          isReady ? "border-ready/50" : "border-coffee/35",
        )}
      >
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-coffee-tint/70 text-[15px] font-bold text-coffee">
            {order.code}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <StatusDot ready={isReady} />
              <span className="text-[15px] font-semibold text-ink">
                {STATUS_LABEL[order.status]}
              </span>
            </div>
            <span className="mt-0.5 block truncate text-[13px] text-ink-soft">
              {branch.name} · {count} {count === 1 ? "item" : "items"}
            </span>
          </div>
          <CaretRightIcon size={18} weight="bold" className="shrink-0 text-ink-faint" />
        </div>

        {/* Received to ready, at a glance. */}
        <div className="mt-3.5 flex gap-1.5" aria-hidden>
          {ACTIVE_STEPS.map((s, i) => (
            <span
              key={s}
              className={clsx(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                i <= step ? (isReady ? "bg-ready" : "bg-coffee") : "bg-line",
              )}
            />
          ))}
        </div>
      </Link>
    </motion.div>
  );
}

function StatusDot({ ready }: { ready: boolean }) {
  return (
    <span className="relative flex size-2">
      {!ready && (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-coffee opacity-70" />
      )}
      <span
        className={clsx(
          "relative inline-flex size-2 rounded-full",
          ready ? "bg-ready" : "bg-coffee",
        )}
      />
    </span>
  );
}
