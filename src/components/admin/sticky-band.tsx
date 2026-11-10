"use client";

import { useEffect, useRef, type ComponentProps } from "react";
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
 * A pinned row of filters and actions. On a phone it becomes one row you swipe
 * sideways. `solo` is for a toolbar with no title band above it.
 */
export function StickyToolbar({
  solo = false,
  className,
  children,
  ...props
}: ComponentProps<"div"> & { solo?: boolean }) {
  return (
    <StickyBand edge className={clsx("band-toolbar", solo && "band-solo", className)} {...props}>
      <div className="band-row flex flex-wrap items-center gap-2">{children}</div>
    </StickyBand>
  );
}
