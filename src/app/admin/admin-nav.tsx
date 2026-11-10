"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MotionConfig, motion } from "motion/react";
import {
  ChartBarIcon,
  ChartLineUpIcon,
  ForkKnifeIcon,
  IdentificationBadgeIcon,
  PlusCircleIcon,
  TentIcon,
  TrayIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { clsx } from "@/lib/clsx";
import { ADMIN_CONTAINER } from "@/components/admin/container";

const TABS = [
  { href: "/admin", label: "Overview", icon: ChartLineUpIcon },
  { href: "/admin/sales", label: "Sales", icon: ChartBarIcon },
  { href: "/admin/customers", label: "Customers", icon: UsersThreeIcon },
  { href: "/admin/events", label: "Events", icon: TentIcon },
  { href: "/admin/menu", label: "Menu", icon: ForkKnifeIcon },
  { href: "/admin/inquiries", label: "Inquiries", icon: TrayIcon },
  { href: "/admin/team", label: "Team", icon: IdentificationBadgeIcon },
  { href: "/admin/orders/new", label: "Log order", icon: PlusCircleIcon },
];

// The transactions list and each order's page are the sales report's detail
// views, so they keep the Sales tab lit rather than claiming a tab of their own.
const TRANSACTIONS = "/admin/orders";
const LOG_ORDER = "/admin/orders/new";

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/sales") {
    const transactions = pathname === TRANSACTIONS || pathname.startsWith(`${TRANSACTIONS}/`);
    return pathname.startsWith(href) || (transactions && !pathname.startsWith(LOG_ORDER));
  }
  return pathname.startsWith(href);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    // The lit pill slides to the tab you open, so the move reads as one place
    // changing rather than two tabs blinking. Reduced motion jumps it instead.
    <MotionConfig reducedMotion="user">
      <nav className={clsx(ADMIN_CONTAINER, "no-scrollbar flex gap-1 overflow-x-auto pb-2")}>
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "pressable group relative isolate flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[14px] font-medium transition-colors duration-200",
                active ? "text-paper" : "text-ink-soft hover:bg-paper-sunk hover:text-ink",
              )}
            >
              {active && (
                <motion.span
                  layoutId="admin-nav-pill"
                  aria-hidden
                  className="absolute inset-0 -z-10 rounded-full bg-ink"
                  transition={{ type: "spring", duration: 0.32, bounce: 0.12 }}
                />
              )}
              <Icon
                size={17}
                weight={active ? "fill" : "regular"}
                className="transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-safe:group-hover:-rotate-8 motion-safe:group-hover:scale-110"
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </MotionConfig>
  );
}
