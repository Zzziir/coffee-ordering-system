"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { peso, type MenuData } from "@/lib/menu";
import { BRANCH_LIST } from "@/lib/branches";
import { PAYMENT_LABEL, type BranchId } from "@/lib/types";
import { logOrder, type LogOrderState } from "./actions";
import { clsx } from "@/lib/clsx";

const inputClass =
  "h-12 w-full rounded-[var(--radius-sm)] border border-line bg-paper-raised px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-coffee";

export function NewOrderForm({ menu }: { menu: MenuData }) {
  const [state, formAction] = useActionState<LogOrderState, FormData>(logOrder, null);

  const [branchId, setBranchId] = useState<BranchId>(BRANCH_LIST[0].id);
  const branch = BRANCH_LIST.find((b) => b.id === branchId)!;
  const [qtys, setQtys] = useState<Record<string, number>>({});

  const available = useMemo(() => menu.items.filter((i) => i.available), [menu]);

  const set = (id: string, next: number) =>
    setQtys((prev) => {
      const copy = { ...prev };
      if (next <= 0) delete copy[id];
      else copy[id] = Math.min(20, next);
      return copy;
    });

  const total = available.reduce((sum, i) => sum + (qtys[i.id] ?? 0) * i.price, 0);
  const count = Object.values(qtys).reduce((n, q) => n + q, 0);
  const payload = JSON.stringify(
    Object.entries(qtys).map(([itemId, qty]) => ({ itemId, qty })),
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
        <input name="customerName" placeholder="Walk-in" className={inputClass} />
      </Field>

      <div>
        <p className="text-[15px] font-semibold text-ink">Items</p>
        <div className="mt-3 flex max-h-[46vh] flex-col gap-6 overflow-y-auto rounded-[var(--radius-md)] border border-line bg-paper-raised p-4">
          {menu.categories.map((cat) => {
            const items = available.filter((i) => i.categoryId === cat.id);
            if (items.length === 0) return null;
            return (
              <section key={cat.id}>
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-faint">
                  {cat.name}
                </h3>
                <div className="mt-2 flex flex-col gap-1.5">
                  {items.map((item) => {
                    const qty = qtys[item.id] ?? 0;
                    return (
                      <div key={item.id} className="flex items-center gap-3">
                        <span className="min-w-0 flex-1 truncate text-[14.5px] text-ink">
                          {item.name}
                          <span className="ml-2 text-[12.5px] text-ink-soft">
                            {peso(item.price)}
                          </span>
                        </span>
                        <Stepper qty={qty} onChange={(n) => set(item.id, n)} />
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {state?.error && (
        <p
          role="alert"
          className="rounded-[var(--radius-sm)] bg-warn/10 px-4 py-3 text-[14px] text-warn"
        >
          {state.error}
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <div className="flex-1">
            <p className="text-[12.5px] text-ink-soft">
              {count} {count === 1 ? "item" : "items"}
            </p>
            <p className="text-[18px] font-bold tabular-nums text-ink">{peso(total)}</p>
          </div>
          <SubmitButton disabled={count === 0} />
        </div>
      </div>
    </form>
  );
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
        disabled={qty === 0}
        aria-label="Remove one"
        className="pressable grid size-8 place-items-center rounded-full text-ink disabled:opacity-25"
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
