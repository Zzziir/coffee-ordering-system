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
 * The pressed look clears when the browser takes the touch for a scroll, or
 * when the finger slides more than 10px away.
 */
export function PressFeedback() {
  useEffect(() => {
    let pressed: Element | null = null;
    let origin = { x: 0, y: 0 };

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
      origin = { x: event.clientX, y: event.clientY };
      target.setAttribute("data-pressed", "");
    };

    // A finger that slides off, or starts dragging a sheet, lets go of the press.
    const move = (event: PointerEvent) => {
      if (pressed && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 10) release();
    };

    const options = { passive: true, capture: true };
    document.addEventListener("pointerdown", press, options);
    document.addEventListener("pointermove", move, options);
    document.addEventListener("pointerup", release, options);
    document.addEventListener("pointercancel", release, options);
    window.addEventListener("blur", release);
    return () => {
      document.removeEventListener("pointerdown", press, options);
      document.removeEventListener("pointermove", move, options);
      document.removeEventListener("pointerup", release, options);
      document.removeEventListener("pointercancel", release, options);
      window.removeEventListener("blur", release);
    };
  }, []);

  return null;
}
