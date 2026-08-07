import { clsx } from "@/lib/clsx";

/**
 * A slow horizontal rail that loops forever, for decorative content behind a
 * bento cell. The children are rendered twice so the seam never shows.
 *
 * Motion is pure CSS, so this stays a server component — and the global
 * prefers-reduced-motion rule in globals.css already stops it.
 */
export function Marquee({
  children,
  className,
  reverse,
  /** seconds for one full pass */
  duration = 40,
}: {
  children: React.ReactNode;
  className?: string;
  reverse?: boolean;
  duration?: number;
}) {
  return (
    <div className={clsx("group flex gap-4 overflow-hidden", className)} aria-hidden>
      {[0, 1].map((pass) => (
        <div
          key={pass}
          className={clsx(
            "flex shrink-0 items-center gap-4",
            reverse ? "animate-[craffe-marquee-reverse_var(--marquee-duration)_linear_infinite]"
                    : "animate-[craffe-marquee_var(--marquee-duration)_linear_infinite]",
          )}
          style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
