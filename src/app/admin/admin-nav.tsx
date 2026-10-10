"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartBarIcon,
  ChartLineUpIcon,
  ForkKnifeIcon,
  PlusCircleIcon,
  TentIcon,
  TrayIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { clsx } from "@/lib/clsx";

const TABS = [
  { href: "/admin", label: "Overview", icon: ChartLineUpIcon },
  { href: "/admin/sales", label: "Sales", icon: ChartBarIcon },
  { href: "/admin/customers", label: "Customers", icon: UsersThreeIcon },
  { href: "/admin/events", label: "Events", icon: TentIcon },
  { href: "/admin/menu", label: "Menu", icon: ForkKnifeIcon },
  { href: "/admin/inquiries", label: "Inquiries", icon: TrayIcon },
  { href: "/admin/orders/new", label: "Log order", icon: PlusCircleIcon },
];

// The transactions list is the sales report's detail view, so it keeps the
// Sales tab lit rather than claiming a tab of its own.
const TRANSACTIONS = "/admin/orders";

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/sales") return pathname.startsWith(href) || pathname === TRANSACTIONS;
  return pathname.startsWith(href);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="no-scrollbar mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "pressable flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[14px] font-medium transition-colors",
              active ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-sunk hover:text-ink",
            )}
          >
            <Icon size={17} weight={active ? "fill" : "regular"} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
