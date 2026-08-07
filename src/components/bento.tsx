import Link from "next/link";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { clsx } from "@/lib/clsx";

/**
 * Bento grid — unequal cells on one rail.
 *
 * The point is that the cells are *not* interchangeable: a row of identical
 * icon-heading-text boxes is the thing this replaces. Each cell earns its span
 * from what it holds, so give the leading content the wide cell and let the
 * supporting content sit narrow beside it.
 *
 * Server-rendered: every effect here is CSS, so no cell costs client JS.
 */
export function BentoGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[21rem]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  name,
  description,
  icon: CellIcon,
  href,
  cta,
  external,
  background,
  className,
  children,
}: {
  name: string;
  description?: string;
  icon?: Icon;
  href?: string;
  cta?: string;
  /** opens in a new tab — used for Maps links */
  external?: boolean;
  /** decorative layer behind the content; masked so it never fights the text */
  background?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        "group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)]",
        "border border-line bg-paper-raised shadow-[var(--shadow-card)]",
        "transition-[transform,box-shadow] duration-300 ease-[var(--ease-out)]",
        "hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]",
        className,
      )}
    >
      {background && (
        <div className="pointer-events-none absolute inset-0 select-none" aria-hidden>
          {background}
        </div>
      )}

      <div className="relative flex flex-1 flex-col p-6">
        {CellIcon && (
          <CellIcon
            size={26}
            weight="fill"
            className="mb-3 text-coffee transition-transform duration-300 ease-[var(--ease-out)] group-hover:-translate-y-0.5"
          />
        )}
        <h2 className="text-[17px] font-semibold leading-tight tracking-tight text-ink">
          {name}
        </h2>
        {description && (
          <p className="mt-1.5 max-w-[38ch] text-[14.5px] leading-relaxed text-ink-soft">
            {description}
          </p>
        )}

        {/* With a CTA below, the body sits under the heading and the CTA takes
            the slack. Without one, the body anchors to the bottom instead, so a
            sparse cell doesn't leave a pool of dead space under its text. */}
        {children && <div className={clsx(href && cta ? "mt-4" : "mt-auto pt-4")}>{children}</div>}

        {href && cta && (
          // Kept in flow rather than revealed on hover: on a phone there is no
          // hover, and this is how someone gets directions.
          <div className="mt-auto pt-5">
            <Link
              href={href}
              {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
              className="pressable inline-flex items-center gap-1.5 text-[14.5px] font-medium text-coffee"
            >
              {cta}
              <ArrowUpRightIcon
                size={15}
                weight="bold"
                className="transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
