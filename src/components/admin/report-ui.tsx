import Link from "next/link";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import { clsx } from "@/lib/clsx";

/** Shared building blocks for the back office report pages. */

export function PageHeader({
  title,
  sub,
  children,
}: {
  title: string;
  sub: React.ReactNode;
  /** Actions, right-aligned on wide screens. */
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        <p className="mt-1 max-w-[62ch] text-[14.5px] text-ink-soft">{sub}</p>
      </div>
      {children}
    </div>
  );
}

/**
 * Change against the previous period. Green and red say good and bad, which is
 * not always up and down, and the arrow plus the signed figure carry the
 * meaning without relying on colour.
 */
function Delta({ value, versus }: { value: number; versus: string }) {
  const up = value >= 0;
  const Icon = up ? ArrowUpRightIcon : ArrowDownRightIcon;
  const percent = Math.abs(value * 100);

  return (
    <span className="inline-flex items-center gap-1 text-[12.5px] text-ink-faint">
      <span
        className={clsx(
          "inline-flex items-center gap-0.5 font-semibold tabular-nums",
          up ? "text-ready" : "text-warn",
        )}
      >
        <Icon size={13} weight="bold" aria-hidden />
        {up ? "+" : "-"}
        {percent >= 100 ? Math.round(percent) : percent.toFixed(1)}%
      </span>
      {versus}
    </span>
  );
}

export function StatTile({
  icon,
  label,
  value,
  sub,
  delta,
  versus = "vs previous period",
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  /** Change as a fraction. null or undefined shows `sub` instead. */
  delta?: number | null;
  versus?: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-line bg-paper-raised p-4">
      <div className="flex items-center gap-2 text-coffee">
        {icon}
        <span className="text-[12.5px] font-medium text-ink-soft">{label}</span>
      </div>
      <p className="mt-2 text-[22px] font-bold tracking-tight text-ink">{value}</p>
      {delta !== null && delta !== undefined ? (
        <Delta value={delta} versus={versus} />
      ) : (
        sub && <p className="text-[12.5px] text-ink-faint">{sub}</p>
      )}
    </div>
  );
}

export function Panel({
  title,
  hint,
  action,
  children,
  className,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "rounded-[var(--radius-md)] border border-line bg-paper-raised p-4 sm:p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          {hint && <p className="mt-0.5 text-[12.5px] text-ink-faint">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export type PillOption = { href: string; label: string; active: boolean };

/** A row of filter links. Filters live in the URL so a view can be shared. */
export function FilterPills({ label, options }: { label: string; options: PillOption[] }) {
  return (
    <nav
      aria-label={label}
      className="no-scrollbar flex max-w-full gap-0.5 overflow-x-auto rounded-full border border-line bg-paper-sunk/50 p-0.5"
    >
      {options.map((option) => (
        <Link
          key={option.href}
          href={option.href}
          aria-current={option.active ? "true" : undefined}
          scroll={false}
          className={clsx(
            "pressable flex h-9 shrink-0 items-center rounded-full px-3.5 text-[13px] font-medium transition-colors",
            option.active ? "bg-ink text-paper" : "text-ink-soft hover:text-ink",
          )}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}

export function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-line bg-paper-raised px-6 py-14 text-center">
      <p className="text-[15px] font-medium text-ink">{title}</p>
      <p className="mx-auto mt-1.5 max-w-[44ch] text-[14px] leading-relaxed text-ink-soft">{children}</p>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={clsx("px-4 py-2.5 font-semibold", className)}>{children}</th>;
}

/** The scrolling shell every report table sits in. */
export function TableShell({ children, minWidth }: { children: React.ReactNode; minWidth: string }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-line">
      <table className="w-full text-left text-[14px]" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export const tableHeadClass = "bg-paper-sunk text-[12.5px] uppercase tracking-wide text-ink-faint";
