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
import { Select } from "@/components/select";
import { ADMIN_CONTAINER } from "@/components/admin/container";

const inputClass =
  "h-11 w-full rounded-[var(--radius-sm)] border border-line bg-paper px-3.5 text-[14.5px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-coffee";

/** A bazaar the till can ring a sale up against. */
export type EventOption = { id: string; name: string; branchId: BranchId };

const STORE_SALE = "";

export function NewOrderForm({
  menu,
  events,
  defaultEventId,
}: {
  menu: MenuData;
  /** Open events only. */
  events: EventOption[];
  /** Preselected when the till was opened from an event, or one is on today. */
  defaultEventId: string | null;
}) {
  const [state, formAction] = useActionState<LogOrderState, FormData>(logOrder, null);

  const [eventId, setEventId] = useState(defaultEventId ?? STORE_SALE);
  const event = events.find((e) => e.id === eventId);
  const [storeBranchId, setBranchId] = useState<BranchId>(BRANCH_LIST[0].id);
  // A booth sells its home branch's menu, so the event decides the branch.
  const branchId = event?.branchId ?? storeBranchId;
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

  const summary = (
    <div>
      <p className="text-[12.5px] text-ink-soft">
        {count} {count === 1 ? "item" : "items"}
      </p>
      <p className="text-[20px] font-bold tracking-tight tabular-nums text-ink">{peso(total)}</p>
    </div>
  );

  return (
    <form
      action={formAction}
      className="grid items-start gap-6 pb-28 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] lg:pb-0"
    >
      <input type="hidden" name="payload" value={payload} />

      {/* The register: who and how, what's on the order, and the total. On a
          wide screen it pins beside the menu so it never scrolls out of reach;
          only its list of lines scrolls when the order runs long. */}
      <aside
        aria-label="This order"
        className="flex flex-col rounded-[var(--radius-lg)] border border-line bg-paper-raised lg:sticky lg:top-[calc(var(--admin-header-h)+0.75rem)] lg:order-2 lg:max-h-[calc(100dvh-var(--admin-header-h)-1.5rem)]"
      >
        <div className="grid shrink-0 grid-cols-2 gap-3 border-b border-line p-4">
          {events.length > 0 && (
            <Field label="Sold at" className="col-span-2">
              <Select
                name="eventId"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className={inputClass}
              >
                <option value={STORE_SALE}>In store</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </Select>
              {event && (
                <p className="mt-1 text-[12.5px] text-ink-soft">
                  Counted under this event, not the store. It skips the barista board.
                </p>
              )}
            </Field>
          )}
          <Field label={event ? "Run by" : "Branch"}>
            <Select
              name="branchId"
              value={branchId}
              // The server takes the branch from the event, so a disabled field
              // dropping out of the submission is fine.
              disabled={Boolean(event)}
              onChange={(e) => setBranchId(e.target.value as BranchId)}
              className={clsx(inputClass, "disabled:opacity-60")}
            >
              {BRANCH_LIST.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Payment">
            <Select name="paymentMethod" defaultValue="cash" className={inputClass}>
              {branch.payments.map((p) => (
                <option key={p} value={p}>
                  {PAYMENT_LABEL[p]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Customer name (optional)" className="col-span-2">
            <input
              name="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Walk-in"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="flex shrink-0 items-baseline justify-between px-4 pb-1 pt-4">
          <h2 className="text-[15px] font-semibold text-ink">In this order</h2>
          {count > 0 && (
            <span className="text-[12.5px] text-ink-soft">
              {count} {count === 1 ? "item" : "items"}
            </span>
          )}
        </div>
        {lines.length === 0 ? (
          <p className="px-4 pb-6 pt-2 text-[14px] text-ink-soft">
            Nothing yet. Tap an item on the menu to add it.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-line lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {lines.map((line) => (
              <div key={line.id} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-medium text-ink">{line.name}</p>
                  {describeLine(line) && (
                    <p className="mt-0.5 text-[12.5px] text-ink-soft">{describeLine(line)}</p>
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

        {(error || logged) && (
          <div className="shrink-0 px-4 pb-3">
            {error && (
              <p role="alert" className="rounded-[var(--radius-sm)] bg-warn/10 px-3.5 py-3 text-[13.5px] text-warn">
                {error}
              </p>
            )}
            {logged && (
              <div
                role="status"
                className="flex items-start gap-2.5 rounded-[var(--radius-sm)] border border-ready/30 bg-ready/10 px-3.5 py-3 text-[13.5px] text-ink"
              >
                <CheckCircleIcon size={19} weight="fill" className="mt-px shrink-0 text-ready" />
                <span>
                  <span className="font-semibold">{logged.code}</span>{" "}
                  {logged.eventName
                    ? `is logged to ${logged.eventName}.`
                    : `is on the ${logged.branchName} board.`}{" "}
                  Ring up the next one.
                </span>
              </div>
            )}
          </div>
        )}

        <div className="hidden shrink-0 items-center justify-between gap-4 border-t border-line p-4 lg:flex">
          {summary}
          <SubmitButton disabled={count === 0} />
        </div>
      </aside>

      {/* The menu scrolls with the page; its search pins under the header. */}
      <section aria-label="Menu" className="min-w-0 lg:order-1">
        <div className="sticky top-[var(--admin-header-h)] z-20 -mt-3 bg-paper/90 py-3 backdrop-blur-md">
          <div role="search" className="relative">
            <MagnifyingGlassIcon
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the menu"
              aria-label="Search the menu"
              className="h-11 w-full rounded-full border border-line bg-paper-raised pl-10 pr-4 text-[14.5px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-coffee [&::-webkit-search-cancel-button]:hidden"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-6">
          {catalog.map(({ cat, items }) => (
            <section key={cat.id}>
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-faint">
                {cat.name}
              </h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSheetItem(item)}
                    className="pressable group flex items-center gap-3 rounded-[var(--radius-sm)] border border-line bg-paper-raised px-3.5 py-3 text-left transition-colors hover:border-coffee/50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-medium text-ink">{item.name}</span>
                      <span className="block text-[12.5px] tabular-nums text-ink-soft">{peso(item.price)}</span>
                    </span>
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-ink transition-colors duration-200 group-hover:border-coffee group-hover:bg-coffee group-hover:text-paper">
                      <PlusIcon
                        size={15}
                        weight="bold"
                        className="transition-transform duration-300 ease-[var(--ease-out)] motion-safe:group-hover:rotate-90"
                      />
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
      </section>

      {/* Phones and tablets: the total and the button ride the bottom edge. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
        <div className={clsx(ADMIN_CONTAINER, "flex items-center justify-end gap-4")}>
          <div className="text-right">{summary}</div>
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
        className="pressable grid size-10 place-items-center rounded-full text-ink"
      >
        <MinusIcon size={15} weight="bold" />
      </button>
      <span className="w-5 text-center text-[14px] font-semibold tabular-nums">{qty}</span>
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        aria-label="Add one"
        className="pressable grid size-10 place-items-center rounded-full text-ink"
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
      className="pressable flex h-12 items-center justify-center rounded-full bg-ink px-7 text-[15px] font-semibold text-paper disabled:opacity-40"
    >
      {pending ? "Logging…" : "Log order"}
    </button>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={clsx("flex min-w-0 flex-col gap-1.5", className)}>
      <label className="text-[13px] font-medium text-ink-soft">{label}</label>
      {children}
    </div>
  );
}
