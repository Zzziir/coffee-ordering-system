"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  MinusIcon,
  PlusIcon,
  TrashIcon,
  ArrowRightIcon,
  ArrowCounterClockwiseIcon,
} from "@phosphor-icons/react";
import { SiteNav } from "@/components/site-nav";
import { CupMark } from "@/components/brand";
import { ItemThumb } from "@/components/item-thumb";
import { useCart } from "@/components/cart-provider";
import { describeLine, lineTotal, type CartLine } from "@/lib/cart";
import { peso } from "@/lib/menu";
import { clsx } from "@/lib/clsx";

const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * A number that rolls over when it changes: the old value slides up and out
 * while the new one slides in from below. Used for line totals, quantities and
 * the subtotal so price changes read as motion rather than a silent swap.
 */
function Rolling({ value, className }: { value: string; className?: string }) {
  return (
    <span className={clsx("relative inline-grid overflow-hidden", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "55%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-55%", opacity: 0 }}
          transition={{ duration: 0.22, ease: EASE }}
          className="tabular-nums [grid-area:1/1]"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { lines, subtotal, addLine, updateQty, removeLine, hydrated, count } = useCart();

  // Lightweight undo: stash the last removed line and offer to restore it for a
  // few seconds, so an accidental delete is recoverable without a toast library.
  const [undoLine, setUndoLine] = useState<CartLine | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleUndoDismiss = useCallback(() => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoLine(null), 5000);
  }, []);

  const handleRemove = useCallback(
    (line: CartLine) => {
      removeLine(line.id);
      setUndoLine(line);
      scheduleUndoDismiss();
    },
    [removeLine, scheduleUndoDismiss],
  );

  const handleUndo = useCallback(() => {
    if (!undoTimer.current) return;
    setUndoLine((line) => {
      // addLine assigns a fresh id, so passing the stashed line restores it.
      if (line) addLine(line);
      return null;
    });
  }, [addLine]);

  useEffect(() => () => void (undoTimer.current && clearTimeout(undoTimer.current)), []);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteNav />

      {hydrated && count === 0 ? (
        <main className="flex flex-1 flex-col items-center justify-center px-6 pb-24 pt-16 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-paper-sunk text-ink-faint">
            <CupMark className="size-9" />
          </span>
          <h1 className="mt-5 text-xl font-bold text-ink">Your bag is empty</h1>
          <p className="mt-1.5 max-w-[28ch] text-[15px] leading-relaxed text-ink-soft">
            Add a drink or two and they&apos;ll show up here, ready to order.
          </p>
          <Link
            href="/menu"
            className="pressable mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-paper"
          >
            Browse the menu
            <ArrowRightIcon size={18} weight="bold" />
          </Link>
        </main>
      ) : (
        <>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-40 pt-6 lg:px-8 lg:pb-16">
            <div className="mb-5 flex items-end justify-between px-1">
              <h1 className="text-2xl font-bold tracking-tight text-ink lg:text-3xl">Your bag</h1>
              <span className="text-[14px] font-medium text-ink-soft">
                {count} {count === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
              {/* Line items */}
              <section>
                <ul className="flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {lines.map((line, index) => {
                      const desc = describeLine(line);
                      return (
                        <motion.li
                          key={line.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.3, ease: EASE, delay: Math.min(index, 7) * 0.045 },
                          }}
                          exit={{ opacity: 0, height: 0, transition: { duration: 0.25, ease: EASE } }}
                          transition={{ layout: { duration: 0.3, ease: EASE } }}
                          className="overflow-hidden"
                        >
                          <div className="cart-card group flex items-start gap-3.5 rounded-[var(--radius-lg)] border border-line bg-paper-raised p-3 shadow-[var(--shadow-card)] sm:gap-4 sm:p-4">
                            {/* Thumbnail, so each drink is recognisable at a glance */}
                            <div className="relative size-[76px] shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-line sm:size-[88px]">
                              <div className="cart-thumb-zoom absolute inset-0">
                                <ItemThumb
                                  item={{ id: line.itemId, name: line.name, image: line.image ?? undefined }}
                                  iconClassName="size-8"
                                  sizes="88px"
                                />
                              </div>
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h3 className="text-[15.5px] font-semibold leading-tight text-ink sm:text-[16px]">
                                    {line.name}
                                  </h3>
                                  {desc && (
                                    <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                                      {desc}
                                    </p>
                                  )}
                                </div>
                                <Rolling
                                  value={peso(lineTotal(line))}
                                  className="shrink-0 text-[15.5px] font-semibold text-ink sm:text-[16px]"
                                />
                              </div>

                              <div className="mt-3 flex items-center justify-between gap-2">
                                <div className="flex items-center rounded-full border border-line bg-paper">
                                  <button
                                    onClick={() => updateQty(line.id, line.qty - 1)}
                                    aria-label="Decrease"
                                    className="pressable grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-paper-sunk"
                                  >
                                    <MinusIcon size={15} weight="bold" />
                                  </button>
                                  <Rolling
                                    value={String(line.qty)}
                                    className="w-6 justify-center text-center text-[15px] font-semibold"
                                  />
                                  <button
                                    onClick={() => updateQty(line.id, line.qty + 1)}
                                    aria-label="Increase"
                                    className="pressable grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-paper-sunk"
                                  >
                                    <PlusIcon size={15} weight="bold" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleRemove(line)}
                                  aria-label={`Remove ${line.name}`}
                                  className="pressable grid size-10 place-items-center rounded-full text-ink-faint transition-colors hover:bg-warn/10 hover:text-warn"
                                >
                                  <TrashIcon size={18} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>

                <Link
                  href="/menu"
                  className="pressable mt-2 inline-flex min-h-11 items-center gap-1.5 text-[15px] font-medium text-coffee"
                >
                  <PlusIcon size={16} weight="bold" />
                  Add more
                </Link>
              </section>

              {/* Order summary — sticky on desktop, replaced by the bottom bar on mobile */}
              <motion.aside
                layout
                className="sticky top-[88px] hidden lg:block"
              >
                <div className="rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5 shadow-[var(--shadow-card)]">
                  <h2 className="text-[15px] font-semibold text-ink">Order summary</h2>
                  <dl className="mt-4 flex flex-col gap-2.5 text-[14px]">
                    <div className="flex items-center justify-between">
                      <dt className="text-ink-soft">Items</dt>
                      <dd className="font-medium tabular-nums text-ink">{count}</dd>
                    </div>
                  </dl>
                  <div className="my-4 border-t border-line" />
                  <div className="flex items-end justify-between">
                    <span className="text-[14px] text-ink-soft">Subtotal</span>
                    <Rolling
                      value={peso(subtotal)}
                      className="text-xl font-bold text-ink"
                    />
                  </div>
                  <button
                    onClick={() => router.push("/checkout")}
                    className="pressable group mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-semibold text-paper"
                  >
                    Continue to checkout
                    <ArrowRightIcon
                      size={18}
                      weight="bold"
                      className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                    />
                  </button>
                  <p className="mt-3 text-center text-[12.5px] leading-relaxed text-ink-faint">
                    Pickup details and any discounts are confirmed at checkout.
                  </p>
                </div>
              </motion.aside>
            </div>
          </main>

          {/* Checkout bar — mobile and tablet only; desktop uses the sticky summary */}
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
            <div className="mx-auto max-w-2xl">
              <div className="mb-3 flex items-center justify-between text-[15px]">
                <span className="text-ink-soft">Subtotal</span>
                <Rolling value={peso(subtotal)} className="text-lg font-bold text-ink" />
              </div>
              <button
                onClick={() => router.push("/checkout")}
                className="pressable group flex h-14 w-full items-center justify-center gap-2 rounded-full bg-ink text-[16px] font-semibold text-paper"
              >
                Continue to checkout
                <ArrowRightIcon
                  size={19}
                  weight="bold"
                  className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Undo toast — recover an accidental remove */}
      <AnimatePresence>
        {undoLine && (
          <motion.div
            key="undo"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.24, ease: EASE }}
            className="fixed bottom-28 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-line bg-ink px-4 py-2.5 text-paper shadow-[var(--shadow-pop)] lg:bottom-6"
          >
            <span className="text-[14px] font-medium">
              Removed {undoLine.name}
            </span>
            <button
              onClick={handleUndo}
              className="pressable inline-flex items-center gap-1.5 rounded-full bg-paper/15 px-3 py-1 text-[13px] font-semibold text-paper transition-colors hover:bg-paper/25"
            >
              <ArrowCounterClockwiseIcon size={14} weight="bold" />
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
