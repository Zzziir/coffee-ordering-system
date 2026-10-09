"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BagIcon, CoffeeIcon, HouseIcon, UserIcon } from "@phosphor-icons/react";
import { useCart } from "./cart-provider";
import { clsx } from "@/lib/clsx";

const TABS = [
  { href: "/", label: "Home", icon: HouseIcon },
  { href: "/menu", label: "Menu", icon: CoffeeIcon },
  { href: "/cart", label: "Bag", icon: BagIcon },
  // Signed-out visitors are sent on to the sign-in page by proxy.ts.
  { href: "/account", label: "Account", icon: UserIcon },
];

const BROWSE_PATHS = new Set(["/", "/menu", "/story", "/gallery", "/contact", "/account"]);

/**
 * The bar belongs on the browsing pages and on order tracking. It stays off
 * the bag and checkout, whose own action bar owns the bottom edge, off the
 * sign-in forms, where it would ride up over the keyboard, and off the staff
 * and admin dashboards entirely.
 */
function showsTabBar(pathname: string) {
  return BROWSE_PATHS.has(pathname) || pathname.startsWith("/order/");
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Phone navigation: the four places a customer goes, within thumb reach.
 * Hidden from lg up, where the header carries the same links.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const { count, hydrated } = useCart();

  if (!showsTabBar(pathname)) return null;

  return (
    <>
      {/* Reserves the bar's footprint so it never covers the end of the page. */}
      <div
        aria-hidden
        className="h-[calc(var(--tabbar-h)+env(safe-area-inset-bottom))] lg:hidden"
      />
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-paper/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto flex h-[var(--tabbar-h)] max-w-md items-stretch px-2">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            const showCount = href === "/cart" && hydrated && count > 0;
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  aria-label={showCount ? `Bag, ${count} items` : undefined}
                  className={clsx(
                    "pressable flex h-full flex-col items-center justify-center gap-1 text-[11.5px] font-medium transition-colors duration-150",
                    active ? "text-ink" : "text-ink-soft",
                  )}
                >
                  <span className="relative">
                    <Icon size={24} weight={active ? "fill" : "regular"} />
                    {showCount && (
                      <span className="absolute -right-2.5 -top-1.5 grid min-w-[18px] place-items-center rounded-full bg-coffee px-1 text-[10.5px] font-bold leading-[18px] tabular-nums text-paper-raised">
                        {count}
                      </span>
                    )}
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
