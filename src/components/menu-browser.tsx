"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { PlusIcon, BagIcon } from "@phosphor-icons/react";
import {
  itemsByCategory,
  getItem,
  isAvailableAt,
  peso,
  type MenuItem,
  type MenuData,
} from "@/lib/menu";
import { CustomizeSheet } from "./customize-sheet";
import { ItemThumb } from "./item-thumb";
import { useCart } from "./cart-provider";
import { clsx } from "@/lib/clsx";

export function MenuBrowser({ menu }: { menu: MenuData }) {
  const params = useSearchParams();
  const { addLine, count, subtotal, hydrated, branchId } = useCart();

  // Availability is per branch: a drink sold out at this store drops from the
  // menu here but stays live at the other. Before a branch is chosen, the gate
  // is up, so we fall back to the master switch.
  const categories = menu.categories.filter((c) =>
    menu.items.some((i) => i.categoryId === c.id && isAvailableAt(i, branchId)),
  );

  const [active, setActive] = useState(categories[0]?.id ?? "");
  const [sheetItem, setSheetItem] = useState<MenuItem | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Deep-link: /menu?item=spanish-latte opens that item's sheet.
  useEffect(() => {
    const id = params.get("item");
    if (id) {
      const item = getItem(menu, id);
      if (item && isAvailableAt(item, branchId)) setSheetItem(item);
    }
  }, [params, menu, branchId]);

  // Track which section is in view to highlight the tab.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target instanceof HTMLElement) {
          setActive(visible.target.dataset.cat!);
        }
      },
      { rootMargin: "-160px 0px -55% 0px", threshold: [0.01, 0.2] },
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    tabRefs.current[active]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [active]);

  const scrollToCat = useCallback((id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <>
      {/* Category rail */}
      <div className="sticky top-[72px] z-30 border-b border-line/70 bg-paper/90 backdrop-blur-md">
        <div className="no-scrollbar mx-auto flex max-w-[1280px] gap-2 overflow-x-auto px-5 py-3 lg:px-8">
          {categories.map((c) => (
            <button
              key={c.id}
              ref={(el) => {
                tabRefs.current[c.id] = el;
              }}
              onClick={() => scrollToCat(c.id)}
              className={clsx(
                "pressable shrink-0 rounded-full px-4 py-2 text-[14px] font-medium transition-colors duration-200",
                active === c.id
                  ? "bg-ink text-paper"
                  : "bg-paper-sunk text-ink-soft hover:text-ink",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="mx-auto max-w-[1280px] px-5 pb-32 pt-4 lg:px-8">
        {categories.map((cat) => {
          const items = itemsByCategory(menu, cat.id).filter((i) =>
            isAvailableAt(i, branchId),
          );
          return (
            <section
              key={cat.id}
              data-cat={cat.id}
              ref={(el) => {
                sectionRefs.current[cat.id] = el;
              }}
              className="scroll-mt-36 pt-10 first:pt-4"
            >
              <div className="flex items-baseline justify-between">
                <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight text-ink">
                  {cat.name}
                </h2>
                {cat.note && (
                  <span className="text-[13.5px] text-ink-faint">{cat.note}</span>
                )}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSheetItem(item)}
                    className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line bg-paper-raised text-left transition-colors duration-200 hover:border-coffee/40"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <ItemThumb item={item} iconClassName="size-14" />
                      {item.signature && (
                        <span className="absolute left-2.5 top-2.5 rounded-full bg-paper/85 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-coffee-deep backdrop-blur-sm">
                          Signature
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="text-[15.5px] font-semibold leading-tight text-ink">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-soft">
                          {item.description}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <span className="text-[16px] font-semibold text-ink">
                          {peso(item.price)}
                        </span>
                        <span className="pressable grid size-9 place-items-center rounded-full border border-line-strong text-ink transition-colors duration-150 group-hover:border-coffee group-hover:bg-coffee group-hover:text-paper-raised">
                          <PlusIcon size={18} weight="bold" />
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Live cart bar */}
      <AnimatePresence>
        {hydrated && count > 0 && (
          <motion.div
            className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          >
            <Link
              href="/cart"
              className="pressable mx-auto flex h-14 max-w-md items-center justify-between rounded-full bg-ink pl-5 pr-3 text-paper shadow-[var(--shadow-pop)]"
            >
              <span className="flex items-center gap-2.5 text-[15px] font-medium">
                <span className="grid size-6 place-items-center rounded-full bg-paper/20 text-[13px] font-bold tabular-nums">
                  {count}
                </span>
                View bag
              </span>
              <span className="flex items-center gap-2 rounded-full bg-paper/15 py-2 pl-4 pr-3 text-[15px] font-semibold tabular-nums">
                {peso(subtotal)}
                <BagIcon size={18} weight="fill" />
              </span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <CustomizeSheet
        menu={menu}
        item={sheetItem}
        onClose={() => setSheetItem(null)}
        onAdd={(payload) => {
          addLine(payload);
          setSheetItem(null);
        }}
      />
    </>
  );
}
