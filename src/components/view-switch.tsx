import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import { GaugeIcon, StorefrontIcon } from "@phosphor-icons/react/dist/ssr";
import { clsx } from "@/lib/clsx";

/**
 * The section toggle for admins: the staff board and the back office are two
 * halves of the same account, so this shows which half you're on and flips to
 * the other in one tap. Replaces the old one-way "Staff"/"Admin" links, which
 * gave no sign of where you were.
 */
export function ViewSwitch({
  current,
  staffHref,
}: {
  current: "staff" | "admin";
  staffHref: string;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-line bg-paper-sunk/50 p-0.5">
      <Segment
        href={staffHref}
        icon={StorefrontIcon}
        label="Staff"
        active={current === "staff"}
      />
      <Segment
        href="/admin"
        icon={GaugeIcon}
        label="Admin"
        active={current === "admin"}
      />
    </div>
  );
}

function Segment({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: Icon;
  label: string;
  active: boolean;
}) {
  if (active) {
    return (
      <span
        aria-current="page"
        className="flex h-9 items-center gap-1.5 rounded-full bg-ink px-3 text-[13px] font-medium text-paper sm:px-3.5"
      >
        <Icon size={16} weight="fill" />
        <span className="sr-only sm:not-sr-only">{label}</span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="pressable flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-ink-soft transition-colors hover:text-ink sm:px-3.5"
    >
      <Icon size={16} weight="bold" />
      {/* Icon only on a phone, where the dashboard header has no room. */}
      <span className="sr-only sm:not-sr-only">{label}</span>
    </Link>
  );
}
