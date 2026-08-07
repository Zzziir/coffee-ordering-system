"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { CaretDownIcon, CheckIcon, StorefrontIcon, XIcon } from "@phosphor-icons/react";
import {
  BRANCH_LIST,
  branchAddress,
  branchFullName,
  getBranch,
  isOpen,
  openStatusLabel,
} from "@/lib/branches";
import type { BranchId } from "@/lib/types";
import { useCart } from "./cart-provider";
import { clsx } from "@/lib/clsx";

/**
 * Choosing which Craffé you're ordering from.
 *
 * Customer routes are not split by branch — the choice is state, not a path
 * segment — so it arrives one of three ways: scanned in from a QR code's
 * `?b=`, remembered from last time, or picked here.
 */

function BranchOptions({
  current,
  onPick,
}: {
  current: BranchId | null;
  onPick: (id: BranchId) => void;
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {BRANCH_LIST.map((branch) => {
        const open = isOpen(branch);
        const active = branch.id === current;
        return (
          <li key={branch.id}>
            <button
              onClick={() => onPick(branch.id)}
              className={clsx(
                "pressable flex w-full items-center gap-3 rounded-[var(--radius-md)] border p-4 text-left transition-colors duration-150",
                active ? "border-coffee bg-coffee-tint/60" : "border-line bg-paper-raised",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[15.5px] font-semibold text-ink">
                  {branchFullName(branch)}
                </span>
                <span className="mt-0.5 block text-[13px] text-ink-soft">
                  {branchAddress(branch)}
                </span>
                <span
                  className={clsx(
                    "mt-1 inline-flex items-center gap-1.5 text-[12.5px] font-medium",
                    open ? "text-ready" : "text-ink-faint",
                  )}
                >
                  <span
                    className={clsx(
                      "size-1.5 rounded-full",
                      open ? "bg-ready" : "bg-ink-faint",
                    )}
                  />
                  {openStatusLabel(branch)}
                </span>
              </span>
              <span
                className={clsx(
                  "grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                  active ? "border-coffee bg-coffee text-paper-raised" : "border-line-strong",
                )}
              >
                {active && <CheckIcon size={13} weight="bold" />}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The gate for a cold visit — someone who typed the URL rather than scanning a
 * table QR. Nothing can be ordered without a branch, so this asks before the
 * menu rather than surprising them at checkout.
 */
export function BranchGate() {
  const { hydrated, branchId, setBranch } = useCart();

  // Wait for hydration or this flashes over a branch that was already chosen.
  if (!hydrated || branchId) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md rounded-t-[var(--radius-xl)] bg-paper p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-[var(--radius-xl)]"
      >
        <span className="grid size-11 place-items-center rounded-full bg-coffee-tint text-coffee">
          <StorefrontIcon size={22} weight="fill" />
        </span>
        <h2 className="mt-4 text-[20px] font-bold tracking-tight text-ink">
          Which Craffé today?
        </h2>
        <p className="mt-1 text-[14.5px] leading-relaxed text-ink-soft">
          We&apos;ll send your order to that counter — same menu, same prices at
          all three.
        </p>
        <div className="mt-5">
          <BranchOptions current={null} onPick={setBranch} />
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * The header chip: which branch you're ordering from, and the way to change it.
 * Switching with a full bag asks first — the bag comes along, since every
 * branch shares one catalog at one set of prices.
 */
export function BranchChip() {
  const { hydrated, branchId, setBranch, count } = useCart();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<BranchId | null>(null);

  // The sheet covers the page; don't let the page scroll behind it.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!hydrated || !branchId) return null;
  const branch = getBranch(branchId);

  const choose = (id: BranchId) => {
    if (id === branchId) {
      setOpen(false);
      return;
    }
    if (count > 0) {
      setPending(id);
      return;
    }
    setBranch(id);
    setOpen(false);
  };

  const close = () => {
    setOpen(false);
    setPending(null);
  };

  // The chip lives inside the site header, which is `backdrop-blur`-ed — and a
  // backdrop-filter makes an element the containing block for its `fixed`
  // descendants. Rendered in place, this sheet would resolve `inset-0` against
  // the 72px header and hang off the top of the screen, clipped. Portal it to
  // the body so it covers the viewport. (site-nav sidesteps the same trap by
  // rendering its mobile menu outside the header.)
  const sheet = (
    <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-[var(--radius-xl)] bg-paper p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-[var(--radius-xl)]"
            >
              {pending ? (
                <>
                  <h2 className="text-[19px] font-bold tracking-tight text-ink">
                    Move your bag to {branchFullName(getBranch(pending))}?
                  </h2>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-soft">
                    Your {count} {count === 1 ? "item" : "items"} will come
                    along — every branch makes the same menu at the same prices.
                  </p>
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={close}
                      className="pressable h-12 flex-1 rounded-full border border-line-strong text-[15px] font-medium text-ink"
                    >
                      Stay here
                    </button>
                    <button
                      onClick={() => {
                        setBranch(pending);
                        close();
                      }}
                      className="pressable h-12 flex-1 rounded-full bg-ink text-[15px] font-semibold text-paper"
                    >
                      Move it
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-[19px] font-bold tracking-tight text-ink">
                      Ordering from
                    </h2>
                    <button
                      onClick={close}
                      aria-label="Close"
                      className="pressable -mr-1.5 -mt-1 grid size-9 place-items-center rounded-full text-ink-soft hover:bg-paper-sunk"
                    >
                      <XIcon size={20} weight="bold" />
                    </button>
                  </div>
                  <div className="mt-4">
                    <BranchOptions current={branchId} onPick={choose} />
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="pressable flex h-9 max-w-[9.5rem] items-center gap-1.5 rounded-full bg-paper-sunk pl-3 pr-2.5 text-[13px] font-medium text-ink-soft"
      >
        <StorefrontIcon size={15} weight="fill" className="shrink-0 text-coffee" />
        <span className="truncate">{branch.name}</span>
        <CaretDownIcon size={12} weight="bold" className="shrink-0" />
      </button>

      {createPortal(sheet, document.body)}
    </>
  );
}
