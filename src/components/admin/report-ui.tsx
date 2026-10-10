import Link from "next/link";
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  CaretLeftIcon,
  CaretRightIcon,
  MagnifyingGlassIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { clsx } from "@/lib/clsx";
import { pageWindow, type Page } from "@/lib/paginate";
import { plural } from "./format";

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

/**
 * A search box that submits as a plain GET, so it works before the page
 * hydrates. `keep` carries the other filters through the submit.
 */
export function SearchField({
  path,
  value,
  label,
  placeholder,
  keep,
  clearHref,
}: {
  path: string;
  value: string;
  /** Names the field for screen readers; the placeholder is not a label. */
  label: string;
  placeholder: string;
  keep: Record<string, string | undefined>;
  /** Where the clear button goes: this view without the search. */
  clearHref: string;
}) {
  return (
    <form action={path} role="search" className="relative w-full sm:w-64">
      {Object.entries(keep).map(
        ([name, kept]) => kept && <input key={name} type="hidden" name={name} value={kept} />,
      )}
      <MagnifyingGlassIcon
        size={17}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
      />
      <input
        type="search"
        name="q"
        defaultValue={value}
        placeholder={placeholder}
        aria-label={label}
        className="h-10 w-full rounded-full border border-line bg-paper-raised pl-10 pr-10 text-[14px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-coffee [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <Link
          href={clearHref}
          scroll={false}
          aria-label="Clear search"
          className="pressable absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-ink-soft hover:text-ink"
        >
          <XIcon size={14} weight="bold" />
        </Link>
      )}
    </form>
  );
}

const pageLinkClass =
  "pressable grid h-10 min-w-10 place-items-center rounded-full px-2 text-[13.5px] font-medium tabular-nums transition-colors";

/**
 * Says which rows are showing and steps through the rest. Pages are links, so
 * a page can be bookmarked and the back button returns to the last one. With a
 * single page it keeps the count and drops the controls.
 */
export function Pagination({
  page,
  noun,
  nounPlural,
  hrefFor,
}: {
  page: Page<unknown>;
  /** What is being counted, singular: "order". */
  noun: string;
  /** Only when adding an "s" is wrong: "inquiries". */
  nounPlural?: string;
  hrefFor: (page: number) => string;
}) {
  if (page.total === 0) return null;

  const count = plural(page.total, noun, nounPlural);
  const summary =
    page.pageCount === 1 ? count : `Showing ${page.from} to ${page.to} of ${count}`;

  const step = (target: number, label: string, icon: React.ReactNode) =>
    target >= 1 && target <= page.pageCount ? (
      <Link href={hrefFor(target)} aria-label={label} className={clsx(pageLinkClass, "text-ink hover:bg-paper-sunk")}>
        {icon}
      </Link>
    ) : (
      <span aria-hidden className={clsx(pageLinkClass, "text-ink-faint opacity-50")}>
        {icon}
      </span>
    );

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <p className="text-[13px] text-ink-soft">{summary}</p>

      {page.pageCount > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-0.5">
          {step(page.page - 1, "Previous page", <CaretLeftIcon size={16} weight="bold" />)}

          {/* Numbers need room; a phone gets the position in words instead. */}
          <span className="px-2 text-[13.5px] tabular-nums text-ink-soft sm:hidden">
            Page {page.page} of {page.pageCount}
          </span>
          <span className="hidden items-center gap-0.5 sm:flex">
            {pageWindow(page.page, page.pageCount).map((number, i) =>
              number === null ? (
                <span key={`gap-${i}`} aria-hidden className="w-6 text-center text-ink-faint">
                  …
                </span>
              ) : (
                <Link
                  key={number}
                  href={hrefFor(number)}
                  aria-label={`Page ${number}`}
                  aria-current={number === page.page ? "page" : undefined}
                  className={clsx(
                    pageLinkClass,
                    number === page.page ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-sunk hover:text-ink",
                  )}
                >
                  {number}
                </Link>
              ),
            )}
          </span>

          {step(page.page + 1, "Next page", <CaretRightIcon size={16} weight="bold" />)}
        </nav>
      )}
    </div>
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
