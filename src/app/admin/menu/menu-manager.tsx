"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MagnifyingGlassIcon, PencilSimpleIcon, StorefrontIcon, XIcon } from "@phosphor-icons/react";
import { isAvailableAt, peso, type MenuData, type MenuItem } from "@/lib/menu";
import type { BranchId } from "@/lib/types";
import { setBranchAvailability } from "./actions";
import { clsx } from "@/lib/clsx";
import { useToast } from "@/components/toast";

type BranchOption = { id: BranchId; name: string };

export function MenuManager({
  menu,
  branches,
  initialBranch,
}: {
  menu: MenuData;
  branches: BranchOption[];
  initialBranch: BranchId;
}) {
  const [branch, setBranch] = useState<BranchId>(initialBranch);
  const branchName = branches.find((b) => b.id === branch)?.name ?? "";
  const [search, setSearch] = useState("");
  const [soldOutOnly, setSoldOutOnly] = useState(false);

  const term = search.trim().toLowerCase();
  const matches = (item: MenuItem) =>
    (!term || item.name.toLowerCase().includes(term)) &&
    (!soldOutOnly || !isAvailableAt(item, branch));
  const sections = menu.categories
    .map((cat) => ({ cat, items: menu.items.filter((i) => i.categoryId === cat.id && matches(i)) }))
    .filter((section) => section.items.length > 0);
  const soldOutCount = menu.items.filter((i) => !isAvailableAt(i, branch)).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Availability is per branch; prices and details are shared. This says
          which store the switches below act on. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[var(--radius-md)] border border-line bg-paper-raised px-4 py-3">
        <StorefrontIcon size={17} weight="bold" className="text-coffee" />
        <span className="text-[13.5px] text-ink-soft">Availability for</span>
        {branches.length > 1 ? (
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value as BranchId)}
            aria-label="Branch to manage"
            className="h-9 rounded-full border border-line bg-paper px-3 text-[13.5px] font-semibold text-ink outline-none transition-colors focus:border-coffee"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-[13.5px] font-semibold text-ink">{branchName}</span>
        )}
        <span className="ml-auto text-[12.5px] text-ink-faint">
          Prices and details apply to every branch.
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <MagnifyingGlassIcon
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the menu"
            aria-label="Search the menu"
            className="h-10 w-full rounded-full border border-line bg-paper-raised pl-10 pr-10 text-[14px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-coffee [&::-webkit-search-cancel-button]:hidden"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="pressable absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-ink-soft hover:text-ink"
            >
              <XIcon size={14} weight="bold" />
            </button>
          )}
        </div>
        <button
          type="button"
          aria-pressed={soldOutOnly}
          onClick={() => setSoldOutOnly((on) => !on)}
          className={clsx(
            "pressable h-10 rounded-full border px-4 text-[13px] font-medium transition-colors",
            soldOutOnly
              ? "border-ink bg-ink text-paper"
              : "border-line bg-paper-raised text-ink-soft hover:text-ink",
          )}
        >
          Sold out at {branchName} ({soldOutCount})
        </button>
      </div>

      {sections.length === 0 && (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-line bg-paper-raised px-6 py-12 text-center">
          <p className="text-[15px] font-medium text-ink">No items match.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSoldOutOnly(false);
            }}
            className="pressable mt-2 h-9 text-[14px] font-semibold text-coffee"
          >
            Clear filters
          </button>
        </div>
      )}

      <div className="flex flex-col gap-8">
        {sections.map(({ cat, items }) => {
          return (
            <section key={cat.id}>
              <h2 className="text-[15px] font-semibold text-ink">{cat.name}</h2>
              <div className="mt-3 flex flex-col gap-2">
                {items.map((item) => (
                  // Keyed by branch so the switch resets its optimistic state
                  // when the owner flips to another store.
                  <ItemRow
                    key={`${item.id}-${branch}`}
                    item={item}
                    branch={branch}
                    branchName={branchName}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ItemRow({
  item,
  branch,
  branchName,
}: {
  item: MenuItem;
  branch: BranchId;
  branchName: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  // Optimistic: flip the switch immediately, reconcile on refresh.
  const [available, setAvailableState] = useState(isAvailableAt(item, branch));

  // The master switch (item form) retires an item everywhere; a branch can't
  // bring back what the owner has turned off outright.
  const retired = !item.available;

  const toggle = () => {
    const next = !available;
    setAvailableState(next);
    startTransition(async () => {
      try {
        await setBranchAvailability(item.id, branch, next);
        router.refresh();
        toast.success(
          next
            ? `${item.name} is back on at ${branchName}.`
            : `${item.name} is sold out at ${branchName}.`,
        );
      } catch {
        setAvailableState(!next); // revert on failure
        toast.error(`Couldn't update ${item.name}. Try again.`);
      }
    });
  };

  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-[var(--radius-md)] border border-line bg-paper-raised px-4 py-3 transition-opacity",
        !available && "opacity-60",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-ink">
          {item.name}
          {item.signature && (
            <span className="ml-2 align-middle text-[11px] font-semibold uppercase tracking-wide text-coffee">
              Signature
            </span>
          )}
        </p>
        <p className="text-[12.5px] text-ink-soft">{peso(item.price)}</p>
      </div>

      {retired ? (
        <span className="shrink-0 rounded-full bg-paper-sunk px-3 py-1.5 text-[12px] font-medium text-ink-faint">
          Off everywhere
        </span>
      ) : (
        <div className="flex shrink-0 items-center gap-2.5">
          <span
            className={clsx(
              "text-[12.5px] font-semibold",
              available ? "text-ready" : "text-warn",
            )}
          >
            {available ? "Available" : "Sold out"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={available}
            aria-label={`${item.name} at ${branchName}: ${available ? "available" : "sold out"}`}
            onClick={toggle}
            disabled={pending}
            className={clsx(
              "pressable inline-flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors disabled:opacity-50",
              available ? "bg-ready" : "bg-line-strong",
            )}
          >
            <span
              className={clsx(
                "size-5 rounded-full bg-paper shadow-sm transition-transform",
                available ? "translate-x-5" : "translate-x-0",
              )}
            />
          </button>
        </div>
      )}

      <Link
        href={`/admin/menu/${item.id}`}
        aria-label={`Edit ${item.name}`}
        className="pressable grid size-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-paper-sunk hover:text-ink"
      >
        <PencilSimpleIcon size={17} weight="bold" />
      </Link>
    </div>
  );
}
