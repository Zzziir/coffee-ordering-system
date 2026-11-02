"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { MinusIcon, PlusIcon, TrashIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { SiteNav } from "@/components/site-nav";
import { CupMark } from "@/components/brand";
import { ItemThumb } from "@/components/item-thumb";
import { useCart } from "@/components/cart-provider";
import { describeLine, lineTotal } from "@/lib/cart";
import { peso } from "@/lib/menu";

export default function CartPage() {
  const router = useRouter();
  const { lines, subtotal, updateQty, removeLine, hydrated, count } = useCart();

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
          <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-40 pt-6">
            <div className="mb-4 flex items-end justify-between px-1">
              <h1 className="text-2xl font-bold tracking-tight text-ink">Your bag</h1>
              <span className="text-[14px] font-medium text-ink-soft">
                {count} {count === 1 ? "item" : "items"}
              </span>
            </div>
            <ul className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {lines.map((line) => {
                  const desc = describeLine(line);
                  return (
                    <motion.li
                      key={line.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start gap-3.5 rounded-[var(--radius-lg)] border border-line bg-paper-raised p-3 shadow-[var(--shadow-card)] sm:gap-4 sm:p-4">
                        {/* Thumbnail, so each drink is recognisable at a glance */}
                        <div className="relative size-[76px] shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-line sm:size-[88px]">
                          <ItemThumb
                            item={{ id: line.itemId, name: line.name, image: line.image ?? undefined }}
                            iconClassName="size-8"
                            sizes="88px"
                          />
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
                            <span className="shrink-0 text-[15.5px] font-semibold tabular-nums text-ink sm:text-[16px]">
                              {peso(lineTotal(line))}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-2">
                            <div className="flex items-center rounded-full border border-line bg-paper">
                              <button
                                onClick={() => updateQty(line.id, line.qty - 1)}
                                aria-label="Decrease"
                                className="pressable grid size-10 place-items-center rounded-full text-ink"
                              >
                                <MinusIcon size={15} weight="bold" />
                              </button>
                              <span className="w-6 text-center text-[15px] font-semibold tabular-nums">
                                {line.qty}
                              </span>
                              <button
                                onClick={() => updateQty(line.id, line.qty + 1)}
                                aria-label="Increase"
                                className="pressable grid size-10 place-items-center rounded-full text-ink"
                              >
                                <PlusIcon size={15} weight="bold" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeLine(line.id)}
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
          </main>

          {/* Checkout bar */}
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
            <div className="mx-auto max-w-2xl">
              <div className="mb-3 flex items-center justify-between text-[15px]">
                <span className="text-ink-soft">Subtotal</span>
                <span className="text-lg font-bold tabular-nums text-ink">
                  {peso(subtotal)}
                </span>
              </div>
              <button
                onClick={() => router.push("/checkout")}
                className="pressable flex h-14 w-full items-center justify-center gap-2 rounded-full bg-ink text-[16px] font-semibold text-paper"
              >
                Continue to checkout
                <ArrowRightIcon size={19} weight="bold" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
