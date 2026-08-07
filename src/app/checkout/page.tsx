"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  StorefrontIcon,
  ClockCountdownIcon,
  CheckIcon,
  DeviceMobileIcon,
  CreditCardIcon,
  MoneyIcon,
} from "@phosphor-icons/react";
import { SiteNav } from "@/components/site-nav";
import { useCart } from "@/components/cart-provider";
import { describeLine, lineTotal } from "@/lib/cart";
import { peso } from "@/lib/menu";
import type { OrderChannel, PaymentMethod } from "@/lib/types";
import { clsx } from "@/lib/clsx";

const GUEST_KEY = "craffe.guest";
const STAMP_KEY = "craffe.stamps";

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, subtotal, clear, hydrated, count } = useCart();

  const [channel, setChannel] = useState<OrderChannel>("onsite");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("gcash");
  const [phase, setPhase] = useState<"idle" | "paying" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  // Prefill from a previous order (guest-first, optional save).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(GUEST_KEY);
      if (raw) {
        const g = JSON.parse(raw);
        if (g.name) setName(g.name);
        if (g.phone) setPhone(g.phone);
      }
    } catch {}
  }, []);

  // Bounce to menu if the bag is empty (e.g. refresh after clearing).
  useEffect(() => {
    if (hydrated && count === 0 && phase === "idle") router.replace("/menu");
  }, [hydrated, count, phase, router]);

  const pay = async () => {
    if (!name.trim()) {
      setError("Please add a name so we can call your order.");
      return;
    }
    setError(null);
    setPhase("paying");

    try {
      localStorage.setItem(GUEST_KEY, JSON.stringify({ name: name.trim(), phone: phone.trim() }));
    } catch {}

    // Simulated payment gateway — a believable beat, no real charge.
    await new Promise((r) => setTimeout(r, method === "cash" ? 500 : 1400));

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          customerName: name.trim(),
          customerPhone: phone.trim() || undefined,
          paymentMethod: method,
          items: lines,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Something went wrong.");
      }
      const { order } = await res.json();

      // Loyalty: one stamp per order (buy 9, get 1 free).
      try {
        const current = Number(localStorage.getItem(STAMP_KEY) || "0");
        localStorage.setItem(STAMP_KEY, String(current + 1));
      } catch {}

      setPhase("done");
      await new Promise((r) => setTimeout(r, 650));
      clear();
      router.replace(`/order/${order.id}`);
    } catch (e) {
      setPhase("idle");
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const payLabel =
    method === "cash" ? `Place order · ${peso(subtotal)}` : `Pay ${peso(subtotal)}`;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteNav />

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-40 pt-6">
        <h1 className="mb-5 text-2xl font-bold tracking-tight text-ink">Checkout</h1>
        {/* Channel */}
        <h2 className="text-[15px] font-semibold text-ink">Pickup</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <ChannelCard
            active={channel === "onsite"}
            onClick={() => setChannel("onsite")}
            icon={<StorefrontIcon size={22} weight={channel === "onsite" ? "fill" : "regular"} />}
            title="I'm here now"
            sub="Pick up at the window"
          />
          <ChannelCard
            active={channel === "pickup"}
            onClick={() => setChannel("pickup")}
            icon={<ClockCountdownIcon size={22} weight={channel === "pickup" ? "fill" : "regular"} />}
            title="Order ahead"
            sub="Grab it when you arrive"
          />
        </div>

        {/* Details */}
        <h2 className="mt-8 text-[15px] font-semibold text-ink">Your details</h2>
        <div className="mt-3 flex flex-col gap-3">
          <Field label="Name" htmlFor="name">
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Who's this order for?"
              autoComplete="given-name"
              className="h-12 w-full rounded-[var(--radius-sm)] border border-line bg-paper-raised px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-coffee"
            />
          </Field>
          <Field label="Mobile number" htmlFor="phone" optional>
            <input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09XX XXX XXXX"
              inputMode="tel"
              autoComplete="tel"
              className="h-12 w-full rounded-[var(--radius-sm)] border border-line bg-paper-raised px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-coffee"
            />
          </Field>
        </div>

        {/* Payment */}
        <h2 className="mt-8 text-[15px] font-semibold text-ink">Payment</h2>
        <div className="mt-3 flex flex-col gap-2">
          <PayOption active={method === "gcash"} onClick={() => setMethod("gcash")} icon={<DeviceMobileIcon size={20} weight="fill" />} title="GCash" sub="Pay now, skip the line" />
          <PayOption active={method === "card"} onClick={() => setMethod("card")} icon={<CreditCardIcon size={20} weight="fill" />} title="Credit / Debit card" sub="Visa, Mastercard" />
          <PayOption active={method === "cash"} onClick={() => setMethod("cash")} icon={<MoneyIcon size={20} weight="fill" />} title="Cash" sub="Pay at the window" />
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-faint">
          Demo mode — no real charge is made. This is where GCash and card
          payments connect in the live version.
        </p>

        {/* Summary */}
        <h2 className="mt-8 text-[15px] font-semibold text-ink">Order summary</h2>
        <ul className="mt-3 flex flex-col gap-2.5">
          {lines.map((line) => (
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
                {peso(lineTotal(line))}
              </span>
            </li>
          ))}
        </ul>

        {error && (
          <p className="mt-5 rounded-[var(--radius-sm)] bg-warn/10 px-4 py-3 text-[14px] text-warn">
            {error}
          </p>
        )}
      </main>

      {/* Pay bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <button
          onClick={pay}
          disabled={phase !== "idle"}
          className="pressable mx-auto flex h-14 w-full max-w-2xl items-center justify-center rounded-full bg-ink text-[16px] font-semibold text-paper disabled:opacity-70"
        >
          {payLabel}
        </button>
      </div>

      {/* Payment overlay */}
      <PaymentOverlay phase={phase} method={method} />
    </div>
  );
}

function ChannelCard({
  active,
  onClick,
  icon,
  title,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "pressable flex flex-col items-start gap-1 rounded-[var(--radius-md)] border p-4 text-left transition-colors duration-150",
        active ? "border-coffee bg-coffee-tint/60" : "border-line bg-paper-raised",
      )}
    >
      <span className={clsx("transition-colors", active ? "text-coffee" : "text-ink-soft")}>
        {icon}
      </span>
      <span className="mt-1 text-[15px] font-semibold text-ink">{title}</span>
      <span className="text-[12.5px] text-ink-soft">{sub}</span>
    </button>
  );
}

function PayOption({
  active,
  onClick,
  icon,
  title,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "pressable flex items-center gap-3 rounded-[var(--radius-sm)] border px-4 py-3 text-left transition-colors duration-150",
        active ? "border-coffee bg-coffee-tint/60" : "border-line bg-paper-raised",
      )}
    >
      <span className={clsx(active ? "text-coffee" : "text-ink-soft")}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-ink">{title}</span>
        <span className="block text-[12.5px] text-ink-soft">{sub}</span>
      </span>
      <span
        className={clsx(
          "grid size-5 place-items-center rounded-full border transition-colors",
          active ? "border-coffee bg-coffee text-paper-raised" : "border-line-strong",
        )}
      >
        {active && <CheckIcon size={13} weight="bold" />}
      </span>
    </button>
  );
}

function PaymentOverlay({ phase, method }: { phase: "idle" | "paying" | "done"; method: PaymentMethod }) {
  return (
    <AnimatePresence>
      {phase !== "idle" && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-paper/95 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {phase === "paying" ? (
            <>
              <span className="size-12 animate-spin rounded-full border-[3px] border-line border-t-coffee" />
              <p className="mt-5 text-[16px] font-medium text-ink">
                {method === "cash" ? "Placing your order…" : "Confirming payment…"}
              </p>
            </>
          ) : (
            <>
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                className="grid size-16 place-items-center rounded-full bg-ready text-paper-raised"
              >
                <CheckIcon size={34} weight="bold" />
              </motion.span>
              <p className="mt-5 text-[16px] font-semibold text-ink">
                {method === "cash" ? "Order placed" : "Payment confirmed"}
              </p>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="flex items-center gap-2 text-[14px] font-medium text-ink">
        {label}
        {optional && <span className="text-[12px] font-normal text-ink-faint">Optional</span>}
      </label>
      {children}
    </div>
  );
}
