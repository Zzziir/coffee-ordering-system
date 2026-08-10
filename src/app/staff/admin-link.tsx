import Link from "next/link";
import { GaugeIcon } from "@phosphor-icons/react/dist/ssr";

/** The way into the back office from the staff board. Render only for admins. */
export function AdminLink() {
  return (
    <Link
      href="/admin"
      className="pressable flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-[13px] font-medium text-ink-soft hover:text-ink"
    >
      <GaugeIcon size={15} weight="bold" />
      Admin
    </Link>
  );
}
