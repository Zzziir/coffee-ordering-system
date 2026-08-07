"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clsx } from "@/lib/clsx";

/**
 * Text that decodes into place — characters churn, then lock in from the left.
 *
 * Three departures from the stock effect, all because this runs on a sentence
 * rather than a two-word label:
 *
 *  - Only letters churn. Spaces and punctuation hold, so the sentence keeps its
 *    shape and word lengths instead of turning into a block of noise.
 *  - A letter churns within its own case, so lowercase copy never flashes as
 *    uppercase shouting mid-flight.
 *  - The settled text is rendered underneath as an invisible sizer, so the box
 *    is always the final text's size. Substituting glyphs in a proportional
 *    face would otherwise reflow the line breaks on every frame.
 *
 * The server renders the real sentence; churn only begins once mounted, so the
 * copy is readable with JS disabled and there is nothing to mis-hydrate.
 */

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const pick = (set: string) => set[Math.floor(Math.random() * set.length)];

/** Letters churn within their own case; everything else is left alone. */
function churn(char: string): string {
  if (char >= "a" && char <= "z") return pick(LOWER);
  if (char >= "A" && char <= "Z") return pick(UPPER);
  return char;
}

export function HyperText({
  text,
  className,
  as: Tag = "p",
  /** ms for the whole sentence to resolve */
  duration = 900,
  /** ms before the first character churns */
  delay = 0,
  /** re-run when the pointer enters. Off by default for anything sentence-length. */
  animateOnHover = false,
}: {
  text: string;
  className?: string;
  as?: "p" | "div" | "span" | "h2";
  duration?: number;
  delay?: number;
  animateOnHover?: boolean;
}) {
  const [display, setDisplay] = useState(text);
  const frame = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    if (timer.current !== null) clearTimeout(timer.current);
    frame.current = null;
    timer.current = null;
  }, []);

  const run = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(text);
      return;
    }
    stop();

    const chars = [...text];
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      // Characters lock in left to right; the rest keep churning.
      const settled = Math.floor(progress * chars.length);
      setDisplay(
        chars.map((c, i) => (i < settled ? c : churn(c))).join(""),
      );
      if (progress < 1) {
        frame.current = requestAnimationFrame(step);
      } else {
        setDisplay(text);
        frame.current = null;
      }
    };

    frame.current = requestAnimationFrame(step);
  }, [text, duration, stop]);

  useEffect(() => {
    timer.current = setTimeout(run, delay);
    return stop;
  }, [run, delay, stop]);

  return (
    <Tag
      className={clsx("grid", className)}
      aria-label={text}
      onPointerEnter={animateOnHover ? run : undefined}
    >
      {/* Sizer: holds the box at the settled text's dimensions. */}
      <span className="invisible [grid-area:1/1]" aria-hidden>
        {text}
      </span>
      <span className="[grid-area:1/1]" aria-hidden>
        {display}
      </span>
    </Tag>
  );
}
