"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";
import { BRANCH_LIST, getBranch } from "@/lib/branches";
import type { BranchId } from "@/lib/types";
import { clsx } from "@/lib/clsx";

/**
 * Owner-only branch hop on the staff board. Owners cover every store, so this
 * lets them jump straight between boards from the header instead of routing back
 * through the branch list. Baristas and managers are pinned to one store and
 * never see it (see /staff/[branch]).
 */
export function BranchSwitch({ current }: { current: BranchId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="pressable flex items-center gap-1.5 rounded-full bg-paper-sunk px-2.5 py-1 text-[12px] font-medium text-ink-soft"
      >
        {getBranch(current).name}
        <CaretDownIcon
          size={12}
          weight="bold"
          className={clsx("transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-[var(--radius-md)] border border-line bg-paper-raised p-1 shadow-lg shadow-ink/5">
          {BRANCH_LIST.map((branch) => {
            const active = branch.id === current;
            return (
              <Link
                key={branch.id}
                href={`/staff/${branch.id}`}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-[13.5px] transition-colors",
                  active
                    ? "font-semibold text-ink"
                    : "text-ink-soft hover:bg-paper-sunk hover:text-ink",
                )}
              >
                {branch.name}
                {active && <CheckIcon size={14} weight="bold" className="text-coffee" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
