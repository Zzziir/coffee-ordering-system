import { clsx } from "@/lib/clsx";

/**
 * Text that resolves into place: each character rises out of a warm blur,
 * tinted with an accent, and sharpens into the colour it inherits.
 *
 * Pure CSS with a per-character `animation-delay`, so this stays a server
 * component and the hero costs no client JS. The `both` fill matters twice
 * over — it holds the finished state, and it means the global
 * prefers-reduced-motion rule (which collapses every duration to 0.001ms)
 * lands on readable text rather than on a blur.
 *
 * Accessibility: the animated characters are hidden from assistive tech and
 * the caller's element carries the real sentence, so nothing reads this
 * letter by letter. Words stay intact for selection, copy and line breaking.
 */

/** Warm accents drawn from the locked palette: amber, coffee, deep roast. */
const CRAFFE_ACCENTS = ["#b26a3c", "#8a6a47", "#5a4130"];

export function DiaTextReveal({
  text,
  colors = CRAFFE_ACCENTS,
  className,
  /** ms before the first character moves */
  delay = 0,
  /** ms between characters */
  stagger = 26,
  /** continues the wave across several segments of one sentence */
  startIndex = 0,
}: {
  text: string;
  colors?: string[];
  className?: string;
  delay?: number;
  stagger?: number;
  startIndex?: number;
}) {
  const words = text.split(" ");
  let index = startIndex;

  return (
    <span className={className} aria-hidden>
      {words.map((word, w) => {
        const chars = [...word];
        const rendered = (
          // Keeping a word whole stops a character breaking to the next line.
          <span key={`w${w}`} className="inline-block whitespace-nowrap">
            {chars.map((char, c) => {
              const style = {
                animationDelay: `${delay + index * stagger}ms`,
                "--dia-tint": colors[index % colors.length],
              } as React.CSSProperties;
              index += 1;
              return (
                <span key={`c${c}`} className="dia-char" style={style}>
                  {char}
                </span>
              );
            })}
          </span>
        );
        // A real space between words, so copied text reads normally.
        return w < words.length - 1 ? [rendered, " "] : rendered;
      })}
    </span>
  );
}

/** How many characters a segment consumes, for chaining `startIndex`. */
export function revealLength(text: string): number {
  return text.split(" ").reduce((n, word) => n + [...word].length, 0);
}
