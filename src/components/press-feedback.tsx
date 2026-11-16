"use client";

import { useEffect } from "react";

/** Everything that has a pressed look in globals.css. */
const PRESS_TARGETS = ".pressable, .tap-dim, .queue-action, .lift-card";

/**
 * Shows the pressed state the instant a finger lands. Touch browsers delay
 * :active (iOS Safari skips it unless the page listens for touches), so this
 * marks the touched control with [data-pressed] on pointerdown, which the press
 * styles key off alongside :active. The tap itself still fires on lift, as on
 * iOS, so a finger that lands on a button to scroll the page does not press it.
 * The browser cancels the pointer when a touch becomes a scroll, which clears
 * the pressed look too.
 */
export function PressFeedback() {
  useEffect(() => {
    let pressed: Element | null = null;

    const release = () => {
      pressed?.removeAttribute("data-pressed");
      pressed = null;
    };

    const press = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const target = event.target instanceof Element ? event.target.closest(PRESS_TARGETS) : null;
      release();
      if (!target || target.matches(":disabled, [aria-disabled='true']")) return;
      pressed = target;
      target.setAttribute("data-pressed", "");
    };

    const options = { passive: true, capture: true };
    document.addEventListener("pointerdown", press, options);
    document.addEventListener("pointerup", release, options);
    document.addEventListener("pointercancel", release, options);
    window.addEventListener("blur", release);
    return () => {
      document.removeEventListener("pointerdown", press, options);
      document.removeEventListener("pointerup", release, options);
      document.removeEventListener("pointercancel", release, options);
      window.removeEventListener("blur", release);
    };
  }, []);

  return null;
}
