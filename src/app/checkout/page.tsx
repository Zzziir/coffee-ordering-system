"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  StorefrontIcon,
  ClockCountdownIcon,
  ArmchairIcon,
  CheckIcon,
  DeviceMobileIcon,
  CreditCardIcon,
  MoneyIcon,
  MoonIcon,
} from "@phosphor-icons/react";
import { SiteNav } from "@/components/site-nav";
import { BranchGate } from "@/components/branch-picker";
import { useCart } from "@/components/cart-provider";
import { describeLine, lineTotal } from "@/lib/cart";
import { peso } from "@/lib/menu";
import type { OrderChannel, PaymentMethod } from "@/lib/types";
import {
  branchAddress,
  branchFullName,
  getBranch,
  isOpen,
  openStatusLabel,
  type Branch,
} from "@/lib/branches";
import { clsx } from "@/lib/clsx";

const GUEST_KEY = "craffe.guest";
const STAMP_KEY = "craffe.stamps";

/**
 * What each channel and payment method is called on the page.
 *
 * Which of them a branch actually offers is config, not a hardcoded list — the
 * page maps over `branch.channels` and `branch.payments`. The orders API
 * validates against the same source, so a branch can never be shown an option
 * it would then reject.
 */
function channelCopy(channel: OrderChannel, branch: Branch) {
  switch (channel) {
    case "dinein":
      return {
        icon: ArmchairIcon,
        title: "Dine in",
        sub: "We'll bring it to your table",
      };
    case "onsite":
      return {
        icon: StorefrontIcon,
        title: "I'm here now",
        sub: `Pick up at the ${branch.pickupNoun}`,
      };
    case "pickup":
      return {
        icon: ClockCountdownIcon,
        title: "Order ahead",
        sub: "Grab it when you arrive",
      };
  }
}

function paymentCopy(method: PaymentMethod, branch: Branch) {
  switch (method) {
    case "gcash":
      return { icon: DeviceMobileIcon, title: "GCash", sub: "Pay now, skip the line" };
    case "maya":
      return { icon: DeviceMobileIcon, title: "Maya", sub: "Pay now, skip the line" };
    case "card":
      return { icon: CreditCardIcon, title: "Credit / Debit card", sub: "Visa, Mastercard" };
    case "cash":
      return { icon: MoneyIcon, title: "Cash", sub: `Pay at the ${branch.pickupNoun}` };
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, subtotal, clear, hydrated, count, branchId } = useCart();
  const branch = branchId ? getBranch(branchId) : null;

  const [channel, setChannel] = useState<OrderChannel>("onsite");
  const [tableNumber, setTableNumber] = useState("");
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

  // Keep the selection inside what this branch offers. Switching from East
  // Rembo (dine-in, card) to MYCC (no card) has to land somewhere valid.
  useEffect(() => {
    if (!branch) return;
    if (!branch.channels.includes(channel)) setChannel(branch.channels[0]);
    if (!branch.payments.includes(method)) setMethod(branch.payments[0]);
  }, [branch, channel, method]);

  // Bounce to menu if the bag is empty (e.g. refresh after clearing).
  useEffect(() => {
    if (hydrated && count === 0 && phase === "idle") router.replace("/menu");
  }, [hydrated, count, phase, router]);

  const pay = async () => {
    if (!branch) return;
    if (!name.trim()) {
      setError("Please add a name so we can call your order.");
      return;
    }
    if (channel === "dinein" && !tableNumber.trim()) {
      setError("Which table are you at?");
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
          branchId: branch.id,
          channel,
          tableNumber: channel === "dinein" ? tableNumber.trim() : undefined,
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

      // Loyalty: one stamp per order (buy 9, get 1 free). Brand-wide — earn at
      // any branch, redeem at any branch.
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

  // Without a branch there is nothing to render against — the gate is asking.
  if (!branch) {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        <SiteNav />
        <BranchGate />
      </div>
    );
  }

  const open = isOpen(branch);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteNav />

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-40 pt-6">
        <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-ink">Checkout</h1>
        <p className="mb-5 text-[14.5px] text-ink-soft">
          Ordering from{" "}
          <span className="font-semibold text-ink">{branchFullName(branch)}</span> ·{" "}
          {branchAddress(branch)}
        </p>

        {!open && (
          <div className="mb-6 flex items-start gap-3 rounded-[var(--radius-md)] border border-line bg-paper-sunk px-4 py-3.5">
            <MoonIcon size={19} weight="fill" className="mt-0.5 shrink-0 text-ink-soft" />
            <p className="text-[14px] leading-relaxed text-ink-soft">
              <span className="font-semibold text-ink">Closed right now.</span>{" "}
              {openStatusLabel(branch)} — you can still order ahead, and they&apos;ll
              start it when the {branch.pickupNoun} opens.
            </p>
          </div>
        )}

        {/* Channel — only what this branch actually runs */}
        <h2 className="text-[15px] font-semibold text-ink">How are you taking it?</h2>
        <div
          className={clsx(
            "mt-3 grid gap-3",
            branch.channels.length > 2 ? "grid-cols-3" : "grid-cols-2",
          )}
        >
          {branch.channels.map((c) => {
            const copy = channelCopy(c, branch);
            const Icon = copy.icon;
            return (
              <ChannelCard
                key={c}
                active={channel === c}
                onClick={() => setChannel(c)}
                icon={<Icon size={22} weight={channel === c ? "fill" : "regular"} />}
                title={copy.title}
                sub={copy.sub}
              />
            );
          })}
        </div>

        {channel === "dinein" && (
          <div className="mt-3">
            <Field label="Table number" htmlFor="table">
              <input
                id="table"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="The number on your table"
                inputMode="numeric"
                className="h-12 w-full rounded-[var(--radius-sm)] border border-line bg-paper-raised px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-coffee"
              />
            </Field>
          </div>
        )}

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

        {/* Payment — only what this branch can actually take */}
        <h2 className="mt-8 text-[15px] font-semibold text-ink">Payment</h2>
        <div className="mt-3 flex flex-col gap-2">
          {branch.payments.map((p) => {
            const copy = paymentCopy(p, branch);
            const Icon = copy.icon;
            return (
              <PayOption
                key={p}
                active={method === p}
                onClick={() => setMethod(p)}
                icon={<Icon size={20} weight="fill" />}
                title={copy.title}
                sub={copy.sub}
              />
            );
          })}
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-faint">
          Demo mode — no real charge is made. This is where GCash, Maya and card
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
