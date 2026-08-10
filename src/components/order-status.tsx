"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  CheckCircleIcon,
  CircleNotchIcon,
  CircleIcon,
  StorefrontIcon,
  ClockCountdownIcon,
  ArmchairIcon,
} from "@phosphor-icons/react";
import type { Order, OrderStatus as Status } from "@/lib/types";
import { PAYMENT_LABEL } from "@/lib/types";
import { branchAddress, getBranch, type Branch } from "@/lib/branches";
import { useOrderStream } from "./use-order-stream";
import { BranchLockup } from "./branch-lockup";
import { describeLine } from "@/lib/cart";
import { peso } from "@/lib/menu";
import { StampCard } from "./stamp-card";
import { clsx } from "@/lib/clsx";

/** The last step reads differently depending on how the order is being taken. */
function steps(order: Order, branch: Branch): { key: Status; label: string; hint: string }[] {
  const ready =
    order.channel === "dinein"
      ? {
          label: "On its way over",
          hint: `Bringing it to table ${order.tableNumber ?? "you"}.`,
        }
      : {
          label: "Ready for pickup",
          hint: `Come grab it at the ${branch.pickupNoun}!`,
        };

  return [
    { key: "received", label: "Order received", hint: "We've got your order." },
    { key: "preparing", label: "Preparing", hint: "Your drinks are being made." },
    { key: "ready", ...ready },
  ];
}

/** How the customer is taking it, in one line, in this branch's words. */
function channelLine(order: Order, branch: Branch) {
  switch (order.channel) {
    case "dinein":
      return {
        Icon: ArmchairIcon,
        text: order.tableNumber ? `Table ${order.tableNumber}` : "Dine in",
      };
    case "onsite":
      return { Icon: StorefrontIcon, text: `Pickup at the ${branch.pickupNoun}` };
    case "pickup":
      return { Icon: ClockCountdownIcon, text: "Order ahead" };
  }
}

function chime() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const notes = [660, 880];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.14;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      osc.start(t);
      osc.stop(t + 0.34);
    });
    setTimeout(() => ctx.close(), 900);
  } catch {}
}

export function OrderStatus({ initial }: { initial: Order }) {
  const [order, setOrder] = useState<Order>(initial);
  const prevStatus = useRef<Status>(initial.status);

  useOrderStream({ order: order.id }, (o) => setOrder(o));

  // Celebrate the moment it turns ready (rare event → delight is earned).
  useEffect(() => {
    if (order.status === "ready" && prevStatus.current !== "ready") {
      navigator.vibrate?.([40, 60, 40]);
      chime();
    }
    prevStatus.current = order.status;
  }, [order.status]);

  const branch = getBranch(order.branchId);
  const STEPS = steps(order, branch);
  const activeIndex = STEPS.findIndex((s) => s.key === order.status);
  const isReady = order.status === "ready" || order.status === "completed";
  // When ready/completed the whole timeline is done — no lingering spinner.
  const currentIndex = isReady ? STEPS.length : activeIndex;
  const { Icon: ChannelIcon, text: channelText } = channelLine(order, branch);

  return (
    <div className="px-5 pb-16 pt-4">
      {/* Which shop this order belongs to — a partner branch signs itself. */}
      <div className="mb-4 flex items-center gap-3">
        <BranchLockup branch={branch} className="h-6 text-[15px] text-ink" />
        <span className="text-[13px] text-ink-soft">{branchAddress(branch)}</span>
      </div>

      {/* Pickup code card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className={clsx(
          "relative overflow-hidden rounded-[var(--radius-xl)] border p-6 text-center transition-colors duration-500",
          isReady ? "border-ready/40 bg-ready-tint" : "border-line bg-paper-raised",
        )}
      >
        <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-ink-soft">
          Pickup number
        </p>
        <motion.p
          key={order.code}
          className={clsx(
            "mt-1 text-[64px] font-bold leading-none tracking-tight tabular-nums",
            isReady ? "text-ready" : "text-ink",
          )}
        >
          {order.code}
        </motion.p>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-[14px] text-ink-soft">
          <ChannelIcon size={16} weight="fill" />
          {channelText}
          {" · "}
          <span className="font-medium text-ink">{order.customerName}</span>
        </p>

        {isReady && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-ready px-4 py-2 text-[14px] font-semibold text-paper-raised"
          >
            <CheckCircleIcon size={18} weight="fill" />
            {order.status === "completed"
              ? order.channel === "dinein"
                ? "Delivered to your table"
                : "Picked up"
              : order.channel === "dinein"
                ? "Ready, on its way over!"
                : "Ready, come on over!"}
          </motion.div>
        )}
      </motion.div>

      {/* Status timeline */}
      <div className="mt-8">
        <ol className="flex flex-col">
          {STEPS.map((step, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex && order.status !== "completed";
            const stamp = order.statusHistory.find((h) => h.status === step.key);
            return (
              <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
                {i < STEPS.length - 1 && (
                  <span
                    className={clsx(
                      "absolute left-[15px] top-9 h-[calc(100%-1.5rem)] w-0.5 transition-colors duration-500",
                      done ? "bg-ready" : "bg-line",
                    )}
                  />
                )}
                <span className="relative z-10 mt-0.5 shrink-0">
                  {done ? (
                    <CheckCircleIcon size={32} weight="fill" className="text-ready" />
                  ) : active ? (
                    <CircleNotchIcon size={32} weight="bold" className="animate-spin text-coffee" />
                  ) : (
                    <CircleIcon size={32} weight="regular" className="text-line-strong" />
                  )}
                </span>
                <div className="pt-1">
                  <p
                    className={clsx(
                      "text-[16px] font-semibold transition-colors",
                      done || active ? "text-ink" : "text-ink-faint",
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-[13.5px] text-ink-soft">
                    {active || done ? step.hint : ""}
                  </p>
                  {stamp && (
                    <p className="mt-0.5 text-[12px] tabular-nums text-ink-faint">
                      {new Date(stamp.at).toLocaleTimeString("en-PH", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        {!isReady && (
          <p className="ml-12 text-[13.5px] text-ink-soft">
            Usually ready in about 8 minutes.
          </p>
        )}
      </div>

      {/* Items */}
      <div className="mt-8 rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5">
        <h2 className="text-[15px] font-semibold text-ink">Your order</h2>
        <ul className="mt-3 flex flex-col gap-2.5">
          {order.items.map((line) => (
            <li key={line.id} className="flex justify-between gap-4 text-[14.5px]">
              <span className="min-w-0 text-ink">
                <span className="font-medium">{line.qty}×</span> {line.name}
                {describeLine(line) && (
                  <span className="block text-[12.5px] text-ink-faint">
                    {describeLine(line)}
                  </span>
                )}
              </span>
              <span className="shrink-0 tabular-nums text-ink-soft">
                {peso(line.lineTotal)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
          <span className="text-[14px] text-ink-soft">
            {order.paid ? "Paid" : `Pay at the ${branch.pickupNoun}`} ·{" "}
            {PAYMENT_LABEL[order.paymentMethod]}
          </span>
          <span className="text-lg font-bold tabular-nums text-ink">
            {peso(order.subtotal)}
          </span>
        </div>
      </div>

      {/* Loyalty */}
      <div className="mt-6">
        <StampCard />
      </div>

      <Link
        href="/menu"
        className="pressable mt-6 flex h-[52px] w-full items-center justify-center rounded-full border border-line-strong text-[15px] font-medium text-ink"
      >
        Order something else
      </Link>
    </div>
  );
}
