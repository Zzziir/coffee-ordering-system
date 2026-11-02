"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { clsx } from "@/lib/clsx";

/**
 * Site-wide light / dark toggle, after Magic UI's AnimatedThemeToggler. Flips
 * `.dark` on <html> and reveals the new theme with a circular clip-path wipe
 * from the button, using the View Transitions API where available. The choice
 * is remembered in localStorage and re-applied before paint by the inline
 * script in the root layout, so there's no flash on reload.
 *
 * `.dark` redefines the design tokens at the root (see globals.css), so the
 * whole app flips. The toggle lives in the customer nav (SiteNav, SiteHeader)
 * and the admin / staff dashboard.
 */

const STORAGE_KEY = "craffe-theme";
// Keeps the browser chrome (PWA status bar, mobile URL bar) in step with the
// page. Mirrors the two ground tones in globals.css.
const THEME_COLOR = { light: "#f6f3ec", dark: "#1b1a17" };

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> };
};

export function AnimatedThemeToggler({ className }: { className?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [isDark, setIsDark] = useState(false);

  // The inline script sets the class before React hydrates; read it back so the
  // icon matches on first paint.
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const apply = (dark: boolean) => {
    document.documentElement.classList.toggle("dark", dark);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? THEME_COLOR.dark : THEME_COLOR.light);
    setIsDark(dark);
    try {
      localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
    } catch {
      // Private mode or storage disabled — the toggle still works this session.
    }
  };

  const toggle = () => {
    const next = !isDark;
    const doc = document as ViewTransitionDocument;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Progressive enhancement: no View Transitions (or reduced motion) just flips.
    if (!doc.startViewTransition || reduce || !ref.current) {
      apply(next);
      return;
    }

    // The wipe grows from this button's exact centre out to the farthest corner.
    const { top, left, width, height } = ref.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = doc.startViewTransition(() => flushSync(() => apply(next)));
    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 640,
          easing: "cubic-bezier(0.23, 1, 0.32, 1)",
          fill: "forwards",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={clsx(
        "pressable grid size-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-paper-sunk hover:text-ink",
        className,
      )}
    >
      {isDark ? <SunIcon size={18} weight="bold" /> : <MoonIcon size={18} weight="bold" />}
    </button>
  );
}
