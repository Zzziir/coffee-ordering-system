"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PencilSimpleIcon } from "@phosphor-icons/react";
import { peso, type MenuData, type MenuItem } from "@/lib/menu";
import { setAvailability } from "./actions";
import { clsx } from "@/lib/clsx";

export function MenuManager({ menu }: { menu: MenuData }) {
  return (
    <div className="flex flex-col gap-8">
      {menu.categories.map((cat) => {
        const items = menu.items.filter((i) => i.categoryId === cat.id);
        if (items.length === 0) return null;
        return (
          <section key={cat.id}>
            <h2 className="text-[15px] font-semibold text-ink">{cat.name}</h2>
            <div className="mt-3 flex flex-col gap-2">
              {items.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ItemRow({ item }: { item: MenuItem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Optimistic: flip the pill immediately, reconcile on refresh.
  const [available, setAvailableState] = useState(item.available);

  const toggle = () => {
    const next = !available;
    setAvailableState(next);
    startTransition(async () => {
      try {
        await setAvailability(item.id, next);
        router.refresh();
      } catch {
        setAvailableState(!next); // revert on failure
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

      <button
        onClick={toggle}
        disabled={pending}
        aria-pressed={available}
        className={clsx(
          "pressable shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors disabled:opacity-50",
          available
            ? "bg-ready/15 text-ready"
            : "bg-warn/15 text-warn",
        )}
      >
        {available ? "Available" : "Sold out"}
      </button>

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
