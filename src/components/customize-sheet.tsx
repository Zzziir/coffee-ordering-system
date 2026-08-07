"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckIcon, MinusIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import type { MenuItem } from "@/lib/menu";
import { addOnGroupsForItem, peso } from "@/lib/menu";
import { ItemThumb } from "./item-thumb";
import type { SelectedGroup } from "@/lib/types";
import { clsx } from "@/lib/clsx";

type AddPayload = {
  itemId: string;
  name: string;
  basePrice: number;
  qty: number;
  groups: SelectedGroup[];
};

export function CustomizeSheet({
  item,
  onClose,
  onAdd,
}: {
  item: MenuItem | null;
  onClose: () => void;
  onAdd: (payload: AddPayload) => void;
}) {
  const reduce = useReducedMotion();
  const groups = useMemo(() => (item ? addOnGroupsForItem(item) : []), [item]);
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [qty, setQty] = useState(1);

  // Reset selection state whenever a new item opens.
  useEffect(() => {
    if (!item) return;
    const init: Record<string, Set<string>> = {};
    for (const g of addOnGroupsForItem(item)) {
      init[g.id] = new Set(
        g.type === "single" && g.defaultOptionId ? [g.defaultOptionId] : [],
      );
    }
    setSelected(init);
    setQty(1);
  }, [item]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!item) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [item, onClose]);

  const toggle = (groupId: string, optionId: string, type: "single" | "multi") => {
    setSelected((prev) => {
      const next = { ...prev };
      const set = new Set(next[groupId]);
      if (type === "single") {
        next[groupId] = new Set([optionId]);
      } else {
        set.has(optionId) ? set.delete(optionId) : set.add(optionId);
        next[groupId] = set;
      }
      return next;
    });
  };

  const unit = useMemo(() => {
    if (!item) return 0;
    let extra = 0;
    for (const g of groups) {
      for (const o of g.options) if (selected[g.id]?.has(o.id)) extra += o.price;
    }
    return item.price + extra;
  }, [item, groups, selected]);

  const handleAdd = () => {
    if (!item) return;
    const chosen: SelectedGroup[] = groups
      .map((g) => {
        const picked = g.options.filter(
          (o) =>
            selected[g.id]?.has(o.id) &&
            (o.price > 0 || g.id.startsWith("size")),
        );
        return picked.length
          ? {
              groupId: g.id,
              groupName: g.name,
              addOns: picked.map((o) => ({ id: o.id, name: o.name, price: o.price })),
            }
          : null;
      })
      .filter((g): g is SelectedGroup => g !== null);

    onAdd({
      itemId: item.id,
      name: item.name,
      basePrice: item.price,
      qty,
      groups: chosen,
    });
  };

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
          />

          {/* Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Customize ${item.name}`}
            className="relative mx-auto flex max-h-[90dvh] w-full max-w-2xl flex-col rounded-t-[var(--radius-xl)] bg-paper shadow-[var(--shadow-sheet)]"
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={{ duration: 0.42, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Grabber + close */}
            <div className="relative shrink-0 pt-3">
              <span className="mx-auto block h-1.5 w-10 rounded-full bg-line-strong" />
              <button
                onClick={onClose}
                aria-label="Close"
                className="pressable absolute right-3 top-2 grid size-9 place-items-center rounded-full text-ink-soft hover:bg-paper-sunk"
              >
                <XIcon size={20} weight="bold" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
              <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-[var(--radius-md)]">
                <ItemThumb item={item} iconClassName="size-16" sizes="(max-width: 672px) 100vw, 640px" />
                {item.signature && (
                  <span className="absolute left-3 top-3 rounded-full bg-paper/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-coffee-deep backdrop-blur-sm">
                    Signature
                  </span>
                )}
              </div>
              <div className="pt-3">
                <h2 className="text-[22px] font-bold leading-tight tracking-tight text-ink">
                  {item.name}
                </h2>
                <p className="mt-1 text-[16px] font-medium text-coffee">
                  {peso(item.price)}
                </p>
                {item.description && (
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
                    {item.description}
                  </p>
                )}
              </div>

              {groups.map((g) => (
                <div key={g.id} className="mt-6">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-[15px] font-semibold text-ink">{g.name}</h3>
                    <span className="text-[13px] text-ink-faint">
                      {g.type === "single" ? "Pick one" : "Optional"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    {g.options.map((o) => {
                      const on = selected[g.id]?.has(o.id) ?? false;
                      return (
                        <button
                          key={o.id}
                          onClick={() => toggle(g.id, o.id, g.type)}
                          className={clsx(
                            "pressable flex items-center justify-between rounded-[var(--radius-sm)] border px-4 py-3 text-left transition-colors duration-150",
                            on
                              ? "border-coffee bg-coffee-tint/60"
                              : "border-line bg-paper-raised",
                          )}
                        >
                          <span className="flex items-center gap-3">
                            <span
                              className={clsx(
                                "grid size-5 shrink-0 place-items-center rounded-full border transition-colors duration-150",
                                on
                                  ? "border-coffee bg-coffee text-paper-raised"
                                  : "border-line-strong",
                                g.type === "single" && "rounded-full",
                              )}
                            >
                              {on && <CheckIcon size={13} weight="bold" />}
                            </span>
                            <span className="text-[15px] font-medium text-ink">
                              {o.name}
                            </span>
                          </span>
                          {o.price > 0 && (
                            <span className="text-[14px] font-medium text-ink-soft">
                              +{peso(o.price)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Quantity */}
              <div className="mt-7 flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-ink">Quantity</h3>
                <div className="flex items-center gap-1 rounded-full border border-line bg-paper-raised p-1">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    aria-label="Decrease quantity"
                    className="pressable grid size-9 place-items-center rounded-full text-ink disabled:opacity-30"
                  >
                    <MinusIcon size={17} weight="bold" />
                  </button>
                  <span className="w-7 text-center text-[16px] font-semibold tabular-nums">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => Math.min(20, q + 1))}
                    aria-label="Increase quantity"
                    className="pressable grid size-9 place-items-center rounded-full text-ink"
                  >
                    <PlusIcon size={17} weight="bold" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sticky add button */}
            <div className="shrink-0 border-t border-line bg-paper px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              <button
                onClick={handleAdd}
                className="pressable flex h-14 w-full items-center justify-between rounded-full bg-ink px-6 text-[16px] font-semibold text-paper"
              >
                <span>Add to bag</span>
                <span className="tabular-nums">{peso(unit * qty)}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
