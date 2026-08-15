"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  StorefrontIcon,
  ClockCountdownIcon,
  ArmchairIcon,
  ArrowRightIcon,
  CheckIcon,
  BellRingingIcon,
} from "@phosphor-icons/react";
import type { BranchId, Order, OrderStatus } from "@/lib/types";
import { useOrderStream } from "./use-order-stream";
import { describeLine } from "@/lib/cart";
import { peso } from "@/lib/menu";
import { clsx } from "@/lib/clsx";

export function StaffQueue({ branchId, initial }: { branchId: BranchId; initial: Order[] }) {
  const [orders, setOrders] = useState<Record<string, Order>>(
    () => Object.fromEntries(initial.map((o) => [o.id, o])),
  );
  const [now, setNow] = useState(() => Date.now());

  useOrderStream({ branch: branchId }, (o) => {
    setOrders((prev) => {
      const next = { ...prev };
      if (o.status === "completed") delete next[o.id];
      else next[o.id] = o;
      return next;
    });
  });

  // Tick the "x min ago" labels.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  const advance = useCallback(async (id: string, status: OrderStatus) => {
    // Optimistic: the SSE echo will reconcile.
    setOrders((prev) => {
      if (!prev[id]) return prev;
      if (status === "completed") {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { ...prev[id], status } };
    });
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }, []);

  const list = Object.values(orders).sort((a, b) => a.createdAt - b.createdAt);
  const inProgress = list.filter((o) => o.status === "received" || o.status === "preparing");
  const ready = list.filter((o) => o.status === "ready");

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-4 md:px-6">
      {list.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-paper-sunk text-ink-faint">
            <BellRingingIcon size={30} weight="regular" />
          </span>
          <p className="mt-4 text-[16px] font-medium text-ink">All caught up</p>
          <p className="mt-1 text-[14px] text-ink-soft">
            New orders will appear here the moment they come in.
          </p>
        </div>
      )}

      {ready.length > 0 && (
        <section className="mb-8">
          <SectionHeader
            label="Ready for pickup"
            count={ready.length}
            tone="ready"
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence initial={false}>
              {ready.map((o) => (
                <OrderCard key={o.id} order={o} now={now} onAdvance={advance} />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      <section>
        <SectionHeader label="In progress" count={inProgress.length} tone="ink" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {inProgress.map((o) => (
              <OrderCard key={o.id} order={o} now={now} onAdvance={advance} />
            ))}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "ready" | "ink";
}) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-[15px] font-semibold uppercase tracking-wide text-ink-soft">
        {label}
      </h2>
      <span
        className={clsx(
          "grid min-w-6 place-items-center rounded-full px-2 text-[13px] font-bold tabular-nums",
          tone === "ready" ? "bg-ready text-paper-raised" : "bg-ink text-paper",
        )}
      >
        {count}
      </span>
    </div>
  );
}

function ChannelIcon({ channel }: { channel: Order["channel"] }) {
  const Icon =
    channel === "dinein"
      ? ArmchairIcon
      : channel === "onsite"
        ? StorefrontIcon
        : ClockCountdownIcon;
  return <Icon size={14} weight="fill" />;
}

function minsAgo(from: number, now: number): string {
  const m = Math.max(0, Math.round((now - from) / 60000));
  if (m < 1) return "just now";
  if (m === 1) return "1 min ago";
  return `${m} mins ago`;
}

function OrderCard({
  order,
  now,
  onAdvance,
}: {
  order: Order;
  now: number;
  onAdvance: (id: string, status: OrderStatus) => void;
}) {
  const isReady = order.status === "ready";
  const next: { status: OrderStatus; label: string; icon: React.ReactNode } =
    order.status === "received"
      ? { status: "preparing", label: "Start preparing", icon: <ArrowRightIcon size={17} weight="bold" /> }
      : order.status === "preparing"
        ? { status: "ready", label: "Mark ready", icon: <BellRingingIcon size={17} weight="bold" /> }
        : { status: "completed", label: "Picked up", icon: <CheckIcon size={17} weight="bold" /> };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
      className={clsx(
        "flex flex-col rounded-[var(--radius-md)] border bg-paper-raised p-4",
        isReady ? "border-ready/40" : "border-line",
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[26px] font-bold leading-none tabular-nums text-ink">
            {order.code}
          </span>
          <p className="mt-1 flex items-center gap-1.5 text-[13.5px] text-ink-soft">
            <ChannelIcon channel={order.channel} />
            <span className="font-medium text-ink">{order.customerName}</span>
            {/* Dine-in is useless to a barista without the table. */}
            {order.channel === "dinein" && order.tableNumber && (
              <span className="rounded-full bg-paper-sunk px-2 py-0.5 text-[12px] font-semibold text-ink">
                Table {order.tableNumber}
              </span>
            )}
          </p>
        </div>
        <span className="text-[12.5px] tabular-nums text-ink-faint">
          {minsAgo(order.createdAt, now)}
        </span>
      </div>

      <ul className="mt-3 flex flex-1 flex-col gap-1.5 border-t border-line pt-3">
        {order.items.map((line) => (
          <li key={line.id} className="text-[14px] leading-snug">
            <span className="font-semibold text-ink">{line.qty}×</span>{" "}
            <span className="text-ink">{line.name}</span>
            {describeLine(line) && (
              <span className="block pl-5 text-[12.5px] text-ink-soft">
                {describeLine(line)}
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <span className="text-[13px] font-medium text-ink-soft">
          {order.paid ? "Paid" : "Unpaid"} · {peso(order.subtotal)}
        </span>
        <button
          onClick={() => onAdvance(order.id, next.status)}
          className={clsx(
            "queue-action inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-semibold text-paper",
            isReady ? "bg-ready" : "bg-ink",
          )}
        >
          {next.label}
          <span className="queue-action-icon inline-flex">{next.icon}</span>
        </button>
      </div>
    </motion.div>
  );
}
