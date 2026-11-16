"use client";

import { useState } from "react";
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
import { Sheet } from "./sheet";

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
  // Nothing to close to: a branch has to be picked, so Escape and swipes do nothing.
  return (
    <Sheet
      open={hydrated && !branchId}
      onClose={() => {}}
      labelledBy="branch-gate-title"
      placement="responsive"
      swipeToClose={false}
      className="max-w-md rounded-t-[var(--radius-xl)] bg-paper p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-[var(--radius-xl)]"
    >
      <span className="grid size-11 place-items-center rounded-full bg-coffee-tint text-coffee">
        <StorefrontIcon size={22} weight="fill" />
      </span>
      <h2 id="branch-gate-title" className="mt-4 text-[20px] font-bold tracking-tight text-ink">
        Which Craffé today?
      </h2>
      <p className="mt-1 text-[14.5px] leading-relaxed text-ink-soft">
        We&apos;ll send your order to that counter. Same menu, same prices at
        both.
      </p>
      <div className="mt-5">
        <BranchOptions current={null} onPick={setBranch} />
      </div>
    </Sheet>
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

  // A <dialog> opens in the top layer, so it covers the viewport even though
  // the chip sits inside the backdrop-blurred header.
  const sheet = (
    <Sheet
      open={open}
      onClose={close}
      label={pending ? "Move your bag" : "Ordering from"}
      placement="responsive"
      className="max-w-md rounded-t-[var(--radius-xl)] bg-paper p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-[var(--radius-xl)]"
    >
      {/* Grabber: on a phone this is a sheet you can swipe away. */}
      <span aria-hidden className="mx-auto -mt-3 mb-3 block h-1.5 w-10 rounded-full bg-line-strong sm:hidden" />
      {pending ? (
        <>
          <h2 className="text-[19px] font-bold tracking-tight text-ink">
            Move your bag to {branchFullName(getBranch(pending))}?
          </h2>
          <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-soft">
            Your {count} {count === 1 ? "item" : "items"} will come
            along, and every branch makes the same menu at the same prices.
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
              className="pressable -mr-2.5 -mt-2 grid size-11 place-items-center rounded-full text-ink-soft hover:bg-paper-sunk"
            >
              <XIcon size={20} weight="bold" />
            </button>
          </div>
          <div className="mt-4">
            <BranchOptions current={branchId} onPick={choose} />
          </div>
        </>
      )}
    </Sheet>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="pressable tap-44 flex h-10 max-w-[11rem] items-center gap-1.5 rounded-full bg-paper-sunk pl-3.5 pr-3 text-[13.5px] font-medium text-ink-soft lg:h-9 lg:max-w-[9.5rem] lg:pl-3 lg:pr-2.5 lg:text-[13px]"
      >
        <StorefrontIcon size={15} weight="fill" className="shrink-0 text-coffee" />
        <span className="truncate">{branch.name}</span>
        <CaretDownIcon size={12} weight="bold" className="shrink-0" />
      </button>

      {sheet}
    </>
  );
}
