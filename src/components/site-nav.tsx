"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BagIcon, ListIcon, XIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { Wordmark } from "./brand";
import { useCart } from "./cart-provider";
import { BranchChip } from "./branch-picker";
import { clsx } from "@/lib/clsx";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/story", label: "Our Story" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteNav() {
  const pathname = usePathname();
  const { count, hydrated } = useCart();
  const [open, setOpen] = useState(false);

  // Close the mobile menu on route change.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <nav className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-5 lg:px-8">
        <Link href="/" aria-label="Craffé home" className="pressable shrink-0">
          <Wordmark className="text-[20px] text-ink" />
        </Link>

        {/* Desktop links */}
        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={clsx(
                  "relative text-[15px] font-medium transition-colors duration-150",
                  isActive(pathname, l.href)
                    ? "text-ink"
                    : "text-ink-soft hover:text-ink",
                )}
              >
                {l.label}
                {isActive(pathname, l.href) && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-1.5 left-0 h-0.5 w-full rounded-full bg-coffee"
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          {/* Only appears once a branch is chosen — it's the way to switch. */}
          <BranchChip />

          <Link
            href="/cart"
            aria-label={`Bag, ${hydrated ? count : 0} items`}
            className="pressable relative grid size-10 place-items-center rounded-full text-ink hover:bg-paper-sunk"
          >
            <BagIcon size={22} weight="regular" />
            <span
              className={clsx(
                "absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-coffee px-1 text-[11px] font-bold leading-5 text-paper-raised transition-all duration-200",
                hydrated && count > 0 ? "scale-100 opacity-100" : "scale-75 opacity-0",
              )}
            >
              {hydrated ? count : 0}
            </span>
          </Link>

          <Link
            href="/menu"
            className="pressable hidden h-11 items-center gap-1.5 rounded-full bg-ink pl-5 pr-4 text-[15px] font-semibold text-paper md:inline-flex"
          >
            Order now
            <ArrowRightIcon size={17} weight="bold" />
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="pressable grid size-10 place-items-center rounded-full text-ink hover:bg-paper-sunk md:hidden"
          >
            <ListIcon size={24} weight="bold" />
          </button>
        </div>
      </nav>
      </header>

      {/* Mobile overlay menu — rendered outside the backdrop-blurred header so
          `position: fixed` resolves against the viewport, not the header. */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col md:hidden"
            style={{ backgroundColor: "var(--color-paper)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex h-[72px] items-center justify-between px-5">
              <Wordmark className="text-[20px] text-ink" />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="pressable grid size-10 place-items-center rounded-full text-ink hover:bg-paper-sunk"
              >
                <XIcon size={24} weight="bold" />
              </button>
            </div>
            <ul className="flex flex-col gap-1 px-5 pt-6">
              {LINKS.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                >
                  <Link
                    href={l.href}
                    className={clsx(
                      "block py-3 text-[28px] font-bold tracking-tight",
                      isActive(pathname, l.href) ? "text-coffee" : "text-ink",
                    )}
                  >
                    {l.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
            <div className="mt-auto p-5">
              <Link
                href="/menu"
                className="pressable flex h-14 w-full items-center justify-center gap-2 rounded-full bg-ink text-[16px] font-semibold text-paper"
              >
                Order now
                <ArrowRightIcon size={18} weight="bold" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
