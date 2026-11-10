"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { clsx } from "@/lib/clsx";

/**
 * A band that pins under the admin header (see `.sticky-band` in globals.css).
 * While pinned it carries [data-stuck], which gives it a frosted background;
 * `edge` marks the lowest band in a stack, which also draws the bottom rule.
 *
 * Stuck is read from layout on scroll (once per frame) and written straight to
 * the element, so scrolling never re-renders React.
 */
export function StickyBand({
  edge = false,
  className,
  ...props
}: ComponentProps<"div"> & { edge?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;

    const check = () => {
      frame = 0;
      const style = getComputedStyle(el);
      const pinnedAt = parseFloat(style.top);
      const stuck =
        style.position === "sticky" &&
        window.scrollY > 0 &&
        el.getBoundingClientRect().top <= pinnedAt + 0.5;
      el.toggleAttribute("data-stuck", stuck);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };

    check();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return <div ref={ref} data-edge={edge || undefined} className={clsx("sticky-band", className)} {...props} />;
}

/**
 * A pinned row: filters on the left, the page's actions at the far right. Once
 * pinned, `title` slides in at the start of the row, so the whole page header
 * condenses into this one balanced bar. On a phone it is one row you swipe
 * sideways, actions included.
 */
export function StickyToolbar({
  title,
  actions,
  className,
  children,
  ...props
}: ComponentProps<"div"> & { title?: string; actions?: ReactNode }) {
  return (
    <StickyBand edge className={clsx("band-toolbar", className)} {...props}>
      {/* Only the filters wrap, inside their own group, so on a narrower
          screen the actions hold the right edge of the first line rather than
          dropping onto a line of their own. */}
      <div className="band-row flex items-start gap-2">
        {title && (
          // The real heading stays in the page; this is its pinned echo.
          <span aria-hidden className="band-mini-title">
            {title}
          </span>
        )}
        <div className="band-filters flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
        {actions && <div className="band-actions flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </StickyBand>
  );
}
