"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartLineUpIcon, ForkKnifeIcon, PlusCircleIcon } from "@phosphor-icons/react";
import { clsx } from "@/lib/clsx";

const TABS = [
  { href: "/admin", label: "Overview", icon: ChartLineUpIcon },
  { href: "/admin/menu", label: "Menu", icon: ForkKnifeIcon },
  { href: "/admin/orders/new", label: "Log order", icon: PlusCircleIcon },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex max-w-5xl gap-1 px-4 pb-2">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "pressable flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-medium transition-colors",
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
