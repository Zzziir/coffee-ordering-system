import { clsx } from "@/lib/clsx";

/** The CRAFFÉ wordmark. Geometric, tracked, echoing the printed logo. */
export function Wordmark({
  className,
  as: Tag = "span",
}: {
  className?: string;
  as?: "span" | "h1" | "div";
}) {
  return (
    <Tag className={clsx("wordmark leading-none", className)}>CRAFFÉ</Tag>
  );
}

/**
 * A single, simple geometric mark: the Craffé to-go cup from the original logo.
 * Lidded, tapered, with the ridged lid band. Inherits currentColor.
 */
export function CupMark({
  className,
  title = "Craffé",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 56"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
    >
      {/* lid dome */}
      <path
        d="M13 12c0-3.5 4.9-6 11-6s11 2.5 11 6H13Z"
        fill="currentColor"
      />
      {/* sip hole */}
      <rect x="21.5" y="2.5" width="5" height="4" rx="1.5" fill="currentColor" />
      {/* ridged lid band */}
      <rect x="11.5" y="13.5" width="25" height="6" rx="1.5" fill="currentColor" />
      {/* cup body, tapered */}
      <path
        d="M14 21h20l-2.2 27.5c-.15 1.9-1.7 3.5-3.6 3.5h-8.4c-1.9 0-3.45-1.6-3.6-3.5L14 21Z"
        fill="currentColor"
      />
    </svg>
  );
}
