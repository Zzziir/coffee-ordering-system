"use client";

import { useEffect, useMemo, useState } from "react";
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
  GiftIcon,
} from "@phosphor-icons/react";
import { SiteNav } from "@/components/site-nav";
import { BranchGate } from "@/components/branch-picker";
import { RewardSaveModal } from "@/components/reward-save-modal";
import { useCart } from "@/components/cart-provider";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { describeLine, lineTotal, unitPrice } from "@/lib/cart";
import { peso } from "@/lib/menu";
import type { OrderChannel, PaymentMethod, SelectedGroup } from "@/lib/types";
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

  // Loyalty: how many free drinks the signed-in customer can redeem, and which
  // menu items count as drinks (so only drinks can be picked as the free one).
  const [reward, setReward] = useState<{ free: number; drinkItemIds: string[] }>({
    free: 0,
    drinkItemIds: [],
  });
  // Redeeming is opt-in: a customer can bank rewards and spend them later.
  const [useReward, setUseReward] = useState(false);
  const [redeemLineId, setRedeemLineId] = useState<string | null>(null);
  // After a guest checks out, prompt them to sign in and keep their stamps.
  const [savePrompt, setSavePrompt] = useState<{ orderId: string; stamps: number } | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    fetch("/api/rewards")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active || !d) return;
        setReward({
          free: Number(d.free) || 0,
          drinkItemIds: Array.isArray(d.drinkItemIds) ? d.drinkItemIds : [],
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // The drinks in the bag are the only lines a free drink can land on. Default
  // the reward to the priciest one; the customer can point it at any other.
  const drinkLines = useMemo(
    () => lines.filter((l) => reward.drinkItemIds.includes(l.itemId)),
    [lines, reward.drinkItemIds],
  );
  const defaultRedeemId = useMemo(
    () =>
      drinkLines.length
        ? drinkLines.reduce((best, l) => (unitPrice(l) > unitPrice(best) ? l : best)).id
        : null,
    [drinkLines],
  );
  const canRedeem = reward.free > 0 && drinkLines.length > 0;
  const activeRedeemId =
    redeemLineId && drinkLines.some((l) => l.id === redeemLineId)
      ? redeemLineId
      : defaultRedeemId;
  const redeemedLine =
    useReward && canRedeem && activeRedeemId
      ? lines.find((l) => l.id === activeRedeemId) ?? null
      : null;
  const discount = redeemedLine ? unitPrice(redeemedLine) : 0;
  const payable = Math.max(0, subtotal - discount);

  // Prefill the details: a signed-in customer's profile first, otherwise the
  // name and phone saved from a previous guest order.
  useEffect(() => {
    const supabase = createBrowserSupabase();
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("first_name, phone")
          .eq("id", user.id)
          .maybeSingle();
        if (!active) return;
        if (data) {
          setName(data.first_name);
          setPhone(data.phone ?? "");
          return;
        }
      }
      try {
        const raw = localStorage.getItem(GUEST_KEY);
        if (raw) {
          const g = JSON.parse(raw);
          if (g.name) setName(g.name);
          if (g.phone) setPhone(g.phone);
        }
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, []);

  // Keep the selection inside what this branch offers. Switching from East
  // Rembo (dine-in, card) to MYCC (no card) has to land somewhere valid.
  useEffect(() => {
    if (!branch) return;
    if (!branch.channels.includes(channel)) setChannel(branch.channels[0]);
    if (!branch.payments.includes(method)) setMethod(branch.payments[0]);
  }, [branch, channel, method]);

  // Bounce to menu if the bag is empty (e.g. refresh after clearing). Not while
  // the guest "save your stamps" prompt is up: the bag was just cleared by a
  // successful order, and that prompt navigates to the order itself on dismiss.
  useEffect(() => {
    if (hydrated && count === 0 && phase === "idle" && !savePrompt) {
      router.replace("/menu");
    }
  }, [hydrated, count, phase, savePrompt, router]);

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
          redeemLineId: redeemedLine ? redeemedLine.id : undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Something went wrong.");
      }
      const { order, stampsEarned, guest } = await res.json();

      // Loyalty: one stamp per drink (food doesn't count). A signed-in customer's
      // stamps live server-side, so only a guest keeps this running tally on the
      // device, which is exactly why it can be lost, hence the prompt below.
      const earned = Number(stampsEarned) || 0;
      let guestStamps = 0;
      if (guest) {
        try {
          guestStamps = Number(localStorage.getItem(STAMP_KEY) || "0") + earned;
          localStorage.setItem(STAMP_KEY, String(guestStamps));
        } catch {}
      }

      setPhase("done");
      await new Promise((r) => setTimeout(r, 650));
      clear();
      // A guest lands on their order via the "save your progress" prompt; a
      // signed-in customer goes straight through. Drop the payment overlay first
      // so the prompt (which sits below it) is what the guest actually sees.
      if (guest) {
        setSavePrompt({ orderId: order.id, stamps: guestStamps });
        setPhase("idle");
      } else {
        router.replace(`/order/${order.id}`);
      }
    } catch (e) {
      setPhase("idle");
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const payLabel =
    method === "cash" ? `Place order · ${peso(payable)}` : `Pay ${peso(payable)}`;

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
              {openStatusLabel(branch)}. You can still order ahead, and they&apos;ll
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
          Demo mode: no real charge is made. This is where GCash, Maya and card
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

        {canRedeem && (
          <RewardPicker
            free={reward.free}
            on={useReward}
            onToggle={() => setUseReward((v) => !v)}
            drinkLines={drinkLines}
            activeId={activeRedeemId}
            onPick={setRedeemLineId}
          />
        )}

        {discount > 0 && (
          <dl className="mt-4 flex flex-col gap-1.5 border-t border-line pt-3 text-[14.5px]">
            <div className="flex justify-between text-ink-soft">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{peso(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-coffee">
              <dt>Free drink reward</dt>
              <dd className="tabular-nums">-{peso(discount)}</dd>
            </div>
            <div className="flex justify-between pt-0.5 text-[15.5px] font-semibold text-ink">
              <dt>Total</dt>
              <dd className="tabular-nums">{peso(payable)}</dd>
            </div>
          </dl>
        )}

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

      {/* Guests: keep your stamps by signing in */}
      <RewardSaveModal
        open={savePrompt !== null}
        stamps={savePrompt?.stamps ?? 0}
        onCreateAccount={() =>
          savePrompt && router.push(`/account/sign-up?next=/order/${savePrompt.orderId}`)
        }
        onSignIn={() =>
          savePrompt && router.push(`/account/sign-in?next=/order/${savePrompt.orderId}`)
        }
        onDismiss={() => savePrompt && router.replace(`/order/${savePrompt.orderId}`)}
      />
    </div>
  );
}

function RewardPicker({
  free,
  on,
  onToggle,
  drinkLines,
  activeId,
  onPick,
}: {
  free: number;
  on: boolean;
  onToggle: () => void;
  drinkLines: { id: string; name: string; basePrice: number; groups: SelectedGroup[] }[];
  activeId: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-[var(--radius-md)] border border-coffee/40 bg-coffee-tint/40">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={on}
        className="pressable flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-coffee text-paper">
          <GiftIcon size={18} weight="fill" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14.5px] font-semibold text-ink">
            Use a free drink
          </span>
          <span className="block text-[12.5px] text-ink-soft">
            {free} ready. Or keep saving them for later.
          </span>
        </span>
        <span
          className={clsx(
            "relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200",
            on ? "bg-coffee" : "bg-line-strong",
          )}
        >
          <span
            className={clsx(
              "absolute top-0.5 size-5 rounded-full bg-paper shadow-sm transition-[left] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
              on ? "left-[1.125rem]" : "left-0.5",
            )}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {on && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-coffee/25 p-4">
              <p className="mb-2.5 text-[12.5px] font-medium text-ink-soft">
                Which drink is on us?
              </p>
              <div className="flex flex-col gap-2">
                {drinkLines.map((line) => {
                  const active = line.id === activeId;
                  return (
                    <button
                      key={line.id}
                      type="button"
                      onClick={() => onPick(line.id)}
                      className={clsx(
                        "pressable flex items-center gap-3 rounded-[var(--radius-sm)] border bg-paper px-3.5 py-2.5 text-left transition-colors duration-150",
                        active ? "border-coffee" : "border-line",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink">
                        {line.name}
                      </span>
                      <span className="shrink-0 text-[13px] tabular-nums text-ink-soft">
                        {peso(unitPrice(line))}
                      </span>
                      <span
                        className={clsx(
                          "grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                          active ? "border-coffee bg-coffee text-paper" : "border-line-strong",
                        )}
                      >
                        {active && <CheckIcon size={12} weight="bold" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
