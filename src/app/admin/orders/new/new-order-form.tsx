"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  MinusIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";
import { isAvailableAt, peso, type MenuData, type MenuItem } from "@/lib/menu";
import { BRANCH_LIST } from "@/lib/branches";
import { PAYMENT_LABEL, type BranchId } from "@/lib/types";
import {
  cartCount,
  cartSubtotal,
  describeLine,
  lineTotal,
  type CartLine,
} from "@/lib/cart";
import { CustomizeSheet } from "@/components/customize-sheet";
import { logOrder, type LogOrderState } from "./actions";
import { clsx } from "@/lib/clsx";

const inputClass =
  "h-12 w-full rounded-[var(--radius-sm)] border border-line bg-paper-raised px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-coffee";

export function NewOrderForm({ menu }: { menu: MenuData }) {
  const [state, formAction] = useActionState<LogOrderState, FormData>(logOrder, null);

  const [branchId, setBranchId] = useState<BranchId>(BRANCH_LIST[0].id);
  const branch = BRANCH_LIST.find((b) => b.id === branchId)!;
  const [lines, setLines] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [sheetItem, setSheetItem] = useState<MenuItem | null>(null);
  const [query, setQuery] = useState("");

  const error = state && "error" in state ? state.error : null;
  const logged = state && "ok" in state ? state : null;

  // A logged order clears the slate so the till is ready for the next sale, but
  // keeps the branch and payment set for a quick run of walk-ins.
  useEffect(() => {
    if (logged) {
      setLines([]);
      setCustomerName("");
    }
  }, [logged]);

  // A till can only ring up what its branch actually has today.
  const available = useMemo(
    () => menu.items.filter((i) => isAvailableAt(i, branchId)),
    [menu, branchId],
  );

  // A drink rung up the same way twice is one line at a higher count, not two
  // rows to tally by hand. Identical item + identical modifiers merge; anything
  // different (a size, a syrup) stays its own line.
  const addLine = (line: Omit<CartLine, "id">) =>
    setLines((prev) => {
      const sig = lineSignature(line);
      const match = prev.find((l) => lineSignature(l) === sig);
      if (match) {
        return prev.map((l) =>
          l.id === match.id ? { ...l, qty: Math.min(20, l.qty + line.qty) } : l,
        );
      }
      return [...prev, { ...line, id: crypto.randomUUID() }];
    });

  const setQty = (id: string, next: number) =>
    setLines((prev) =>
      next <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) => (l.id === id ? { ...l, qty: Math.min(20, next) } : l)),
    );

  const q = query.trim().toLowerCase();
  const catalog = menu.categories
    .map((cat) => ({
      cat,
      items: available.filter(
        (i) => i.categoryId === cat.id && (!q || i.name.toLowerCase().includes(q)),
      ),
    }))
    .filter((group) => group.items.length > 0);

  const total = cartSubtotal(lines);
  const count = cartCount(lines);

  // Only ids cross the wire; the server re-reads every name and price from the
  // menu, so the form can never talk the till into the wrong total.
  const payload = JSON.stringify(
    lines.map((l) => ({
      itemId: l.itemId,
      qty: l.qty,
      selections: l.groups.map((g) => ({
        groupId: g.groupId,
        optionIds: g.addOns.map((a) => a.id),
      })),
    })),
  );

  return (
    <form action={formAction} className="flex flex-col gap-5 pb-28">
      <input type="hidden" name="payload" value={payload} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Branch">
          <select
            name="branchId"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value as BranchId)}
            className={inputClass}
          >
            {BRANCH_LIST.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Payment">
          <select name="paymentMethod" defaultValue="cash" className={inputClass}>
            {branch.payments.map((p) => (
              <option key={p} value={p}>
                {PAYMENT_LABEL[p]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Customer name (optional)">
        <input
          name="customerName"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Walk-in"
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 lg:h-[60vh] lg:grid-cols-[1.35fr_1fr]">
        {/* Picker: search the catalog and tap to configure */}
        <div className="flex flex-col lg:h-full">
          <p className="text-[15px] font-semibold text-ink">Items</p>
          <div className="mt-3 flex flex-col rounded-[var(--radius-md)] border border-line bg-paper-raised lg:min-h-0 lg:flex-1">
            <div className="shrink-0 border-b border-line p-3">
              <div className="relative">
                <MagnifyingGlassIcon
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search items..."
                  aria-label="Search items"
                  className="h-11 w-full rounded-full border border-line bg-paper pl-10 pr-4 text-[14.5px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-coffee"
                />
              </div>
            </div>

            <div className="flex max-h-[52vh] flex-col gap-6 overflow-y-auto p-4 lg:max-h-none lg:min-h-0 lg:flex-1">
              {catalog.map(({ cat, items }) => (
                <section key={cat.id}>
                  <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-faint">
                    {cat.name}
                  </h3>
                  <div className="mt-2 flex flex-col gap-1">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSheetItem(item)}
                        className="pressable flex items-center gap-3 rounded-[var(--radius-sm)] px-2 py-1.5 text-left transition-colors hover:bg-paper-sunk"
                      >
                        <span className="min-w-0 flex-1 truncate text-[14.5px] text-ink">
                          {item.name}
                          <span className="ml-2 text-[12.5px] text-ink-soft">
                            {peso(item.price)}
                          </span>
                        </span>
                        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-ink">
                          <PlusIcon size={15} weight="bold" />
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}

              {catalog.length === 0 && (
                <p className="py-6 text-center text-[14px] text-ink-soft">
                  {q ? `No items match "${query.trim()}".` : "No items available."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Order summary: matches the picker's height, scrolls on its own */}
        <div className="flex flex-col lg:h-full">
          <div className="flex items-baseline justify-between">
            <p className="text-[15px] font-semibold text-ink">In this order</p>
            {count > 0 && (
              <span className="text-[12.5px] text-ink-soft">
                {count} {count === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-col rounded-[var(--radius-md)] border border-line bg-paper-raised lg:min-h-0 lg:flex-1">
            {lines.length === 0 ? (
              <div className="grid place-items-center px-4 py-12 lg:flex-1">
                <p className="text-center text-[14px] text-ink-soft">
                  No items yet. Search on the left and tap to add.
                </p>
              </div>
            ) : (
              <div className="flex max-h-[52vh] flex-col divide-y divide-line overflow-y-auto lg:max-h-none lg:min-h-0 lg:flex-1">
                {lines.map((line) => (
                  <div key={line.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14.5px] font-medium text-ink">{line.name}</p>
                      {describeLine(line) && (
                        <p className="mt-0.5 text-[12.5px] text-ink-soft">
                          {describeLine(line)}
                        </p>
                      )}
                      <p className="mt-0.5 text-[12.5px] font-medium tabular-nums text-ink-soft">
                        {peso(lineTotal(line))}
                      </p>
                    </div>
                    <Stepper qty={line.qty} onChange={(n) => setQty(line.id, n)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-sm)] bg-warn/10 px-4 py-3 text-[14px] text-warn"
        >
          {error}
        </p>
      )}

      {logged && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-ready/30 bg-ready/10 px-4 py-3 text-[14px] text-ink"
        >
          <CheckCircleIcon size={20} weight="fill" className="shrink-0 text-ready" />
          <span>
            <span className="font-semibold">{logged.code}</span> is on the{" "}
            {logged.branchName} board. Ring up the next one below.
          </span>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-end gap-4">
          <div className="text-right">
            <p className="text-[12.5px] text-ink-soft">
              {count} {count === 1 ? "item" : "items"}
            </p>
            <p className="text-[18px] font-bold tabular-nums text-ink">{peso(total)}</p>
          </div>
          <SubmitButton disabled={count === 0} />
        </div>
      </div>

      {/* Same customize step the customer uses, so sizes, milk, and extras are
          captured identically. Staff add to the order rather than a bag. */}
      <CustomizeSheet
        menu={menu}
        item={sheetItem}
        onClose={() => setSheetItem(null)}
        onAdd={(payload) => {
          addLine(payload);
          setSheetItem(null);
        }}
        addLabel="Add to order"
      />
    </form>
  );
}

/** A canonical key for a line's configuration — same item, same chosen options,
 *  in any order. Two lines with equal signatures are the exact same drink. */
function lineSignature(line: Pick<CartLine, "itemId" | "groups">): string {
  const groups = line.groups
    .map((g) => `${g.groupId}:${g.addOns.map((a) => a.id).sort().join(",")}`)
    .sort()
    .join("|");
  return `${line.itemId}#${groups}`;
}

function Stepper({ qty, onChange }: { qty: number; onChange: (n: number) => void }) {
  return (
    <div
      className={clsx(
        "flex items-center gap-1 rounded-full border p-0.5 transition-colors",
        qty > 0 ? "border-coffee bg-coffee-tint/50" : "border-line",
      )}
    >
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        aria-label="Remove one"
        className="pressable grid size-8 place-items-center rounded-full text-ink"
      >
        <MinusIcon size={15} weight="bold" />
      </button>
      <span className="w-5 text-center text-[14px] font-semibold tabular-nums">{qty}</span>
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        aria-label="Add one"
        className="pressable grid size-8 place-items-center rounded-full text-ink"
      >
        <PlusIcon size={15} weight="bold" />
      </button>
    </div>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="pressable flex h-14 items-center justify-center rounded-full bg-ink px-8 text-[15px] font-semibold text-paper disabled:opacity-40"
    >
      {pending ? "Logging…" : "Log order"}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[14px] font-medium text-ink">{label}</label>
      {children}
    </div>
  );
}
