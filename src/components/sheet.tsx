"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { clsx } from "@/lib/clsx";

/**
 * Where the panel sits.
 * - bottom: a sheet that rises from the bottom edge at every width.
 * - responsive: a bottom sheet on phones, a centred dialog from `sm` up.
 * - center: a centred dialog at every width.
 */
export type SheetPlacement = "bottom" | "responsive" | "center";

/** iOS drawer curve: quick off the mark, long soft landing. */
const EASE_DRAWER = "cubic-bezier(0.32, 0.72, 0, 1)";
const ENTER_MS = 420;
/** A centred dialog only grows a few percent, so it needs less time. */
const ENTER_CENTER_MS = 260;
/** Leaving is the system responding, so it is quicker than arriving. */
const EXIT_MS = 260;
/** Released past this share of its height, a dragged sheet closes. */
const CLOSE_DISTANCE = 0.25;
/** px per ms. A flick this fast closes the sheet however far it travelled. */
const CLOSE_VELOCITY = 0.4;
/** How far an upward pull can stretch before it stops giving. */
const RUBBER_LIMIT = 48;

const SM_UP = "(min-width: 640px)";

/** iOS rubber band: the further you pull, the less it moves. */
function rubberBand(distance: number) {
  return (distance * 0.55 * RUBBER_LIMIT) / (distance * 0.55 + RUBBER_LIMIT);
}

/** The nearest scrollable box between the touch and the panel, if any. */
function scrollerFor(target: EventTarget | null, panel: HTMLElement): HTMLElement | null {
  for (let el = target as HTMLElement | null; el && el !== panel; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if ((overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight) return el;
  }
  return null;
}

function translateYOf(el: HTMLElement) {
  return new DOMMatrixReadOnly(getComputedStyle(el).transform).m42;
}

/**
 * A modal panel built on the browser's own <dialog>: focus moves in and comes
 * back on close, Escape closes it, the page behind is inert to clicks, keys and
 * screen readers, and it sits in the top layer above everything.
 *
 * On a phone it behaves like an iOS sheet. A finger dragging it down moves it
 * one to one, an upward pull meets growing friction, and letting go far enough
 * down or with a flick closes it; otherwise it springs back. A drag that starts
 * inside a scrolled list scrolls the list instead, until the list is back at
 * its top. Only the first finger counts.
 *
 * The caller owns `open`; the sheet keeps showing its last content while it
 * animates out.
 */
export function Sheet({
  open,
  onClose,
  label,
  labelledBy,
  placement = "bottom",
  swipeToClose = placement !== "center",
  className,
  backdropClassName,
  decoration,
  children,
}: {
  open: boolean;
  /** Called for Escape, a backdrop tap or a swipe down. */
  onClose: () => void;
  /** Accessible name, when no visible heading names the sheet. */
  label?: string;
  /** id of the visible heading that names the sheet. */
  labelledBy?: string;
  placement?: SheetPlacement;
  swipeToClose?: boolean;
  /** The panel: width, height, radius, background, padding. */
  className?: string;
  /** Restyles the dimmed page behind, e.g. darker for a photo. */
  backdropClassName?: string;
  /**
   * Drawn over the whole sheet without taking taps, such as a confetti canvas.
   * An open dialog sits above everything else on the page, so effects meant to
   * show over it have to live inside it.
   */
  decoration?: React.ReactNode;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  // Content stays mounted through the exit animation, then goes.
  const [mounted, setMounted] = useState(open);
  const lastChildren = useRef(children);
  if (open) lastChildren.current = children;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  if (open && !mounted) setMounted(true);

  // How this sheet moves right now: bottom sheet or centred dialog.
  const slides = () =>
    placement === "bottom" || (placement === "responsive" && !window.matchMedia(SM_UP).matches);
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Enter.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!open || !dialog || !panel || !backdrop || dialog.open) return;
    dialog.showModal();
    const timing = { duration: reduced() ? 200 : slides() ? ENTER_MS : ENTER_CENTER_MS, easing: EASE_DRAWER };
    const from = reduced()
      ? { opacity: 0 }
      : slides()
        ? { transform: "translateY(100%)" }
        : { transform: "scale(0.96)", opacity: 0 };
    panel.animate([from, { transform: "none", opacity: 1 }], timing);
    backdrop.animate([{ opacity: 0 }, { opacity: 1 }], timing);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Exit, from wherever the panel is now (mid-drag included).
  useEffect(() => {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (open || !dialog?.open || !panel || !backdrop) return;
    const y = translateYOf(panel);
    const timing = { duration: reduced() ? 160 : EXIT_MS, easing: EASE_DRAWER, fill: "forwards" as const };
    const to = reduced()
      ? { opacity: 0 }
      : slides()
        ? { transform: "translateY(100%)" }
        : y > 0
          ? { transform: `translateY(${y + 160}px)`, opacity: 0 }
          : { transform: "scale(0.96)", opacity: 0 };
    panel.getAnimations().forEach((a) => a.cancel());
    const exit = panel.animate([{ transform: getComputedStyle(panel).transform }, to], timing);
    backdrop.animate([{ opacity: getComputedStyle(backdrop).opacity }, { opacity: 0 }], timing);
    exit.onfinish = () => {
      dialog.close();
      panel.getAnimations().forEach((a) => a.cancel());
      backdrop.getAnimations().forEach((a) => a.cancel());
      panel.style.transform = "";
      backdrop.style.opacity = "";
      setMounted(false);
    };
    return () => {
      exit.onfinish = null;
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Drag to close. Touch only: a mouse closes it with Escape or the backdrop.
  useEffect(() => {
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!mounted || !swipeToClose || !panel || !backdrop) return;

    let drag: {
      id: number;
      startX: number;
      startY: number;
      startTime: number;
      scroller: HTMLElement | null;
      mode: "undecided" | "drag" | "pass";
      offset: number;
      samples: { y: number; t: number }[];
    } | null = null;

    const setOffset = (offset: number) => {
      panel.style.transform = offset === 0 ? "" : `translateY(${offset}px)`;
      const progress = Math.min(Math.max(offset, 0) / panel.offsetHeight, 1);
      backdrop.style.opacity = String(1 - progress);
    };

    const onStart = (event: TouchEvent) => {
      if (drag || event.touches.length > 1 || !slides() && placement !== "center") return;
      const touch = event.changedTouches[0];
      drag = {
        id: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: performance.now(),
        scroller: scrollerFor(event.target, panel),
        mode: "undecided",
        offset: 0,
        samples: [{ y: touch.clientY, t: performance.now() }],
      };
    };

    const onMove = (event: TouchEvent) => {
      if (!drag || drag.mode === "pass") return;
      const touch = [...event.changedTouches].find((t) => t.identifier === drag!.id);
      if (!touch) return;
      const dy = touch.clientY - drag.startY;
      const dx = touch.clientX - drag.startX;

      if (drag.mode === "undecided") {
        // Sideways, or upward inside a list: that's a scroll, leave it be.
        const atTop = !drag.scroller || drag.scroller.scrollTop <= 0;
        const down = dy > 0;
        if (Math.abs(dx) > Math.abs(dy) || (drag.scroller && (!down || !atTop))) {
          drag.mode = "pass";
          return;
        }
        drag.mode = "drag";
        panel.getAnimations().forEach((a) => a.cancel());
        backdrop.getAnimations().forEach((a) => a.cancel());
      }

      event.preventDefault();
      // One to one with the finger from where it landed.
      const travel = dy;
      drag.offset = travel >= 0 ? travel : -rubberBand(-travel);
      setOffset(drag.offset);
      drag.samples.push({ y: touch.clientY, t: performance.now() });
      if (drag.samples.length > 6) drag.samples.shift();
    };

    const onEnd = (event: TouchEvent) => {
      if (!drag || ![...event.changedTouches].some((t) => t.identifier === drag!.id)) return;
      const { mode, offset, samples, startTime } = drag;
      drag = null;
      if (mode !== "drag") return;

      const first = samples[0];
      const last = samples[samples.length - 1];
      const recent = last.t > first.t ? (last.y - first.y) / (last.t - first.t) : 0;
      const overall = offset / Math.max(performance.now() - startTime, 1);
      const flicked = recent > 0 && overall > CLOSE_VELOCITY;
      if (offset > 0 && (flicked || offset > panel.offsetHeight * CLOSE_DISTANCE)) {
        onCloseRef.current();
        return;
      }
      // Not far enough: settle back.
      const timing = { duration: 300, easing: EASE_DRAWER };
      panel.animate([{ transform: `translateY(${offset}px)` }, { transform: "none" }], timing);
      backdrop.animate([{ opacity: backdrop.style.opacity || "1" }, { opacity: 1 }], timing);
      setOffset(0);
    };

    // Non-passive, so a drag can stop the page from scrolling under it.
    panel.addEventListener("touchstart", onStart, { passive: true });
    panel.addEventListener("touchmove", onMove, { passive: false });
    panel.addEventListener("touchend", onEnd);
    panel.addEventListener("touchcancel", onEnd);
    return () => {
      panel.removeEventListener("touchstart", onStart);
      panel.removeEventListener("touchmove", onMove);
      panel.removeEventListener("touchend", onEnd);
      panel.removeEventListener("touchcancel", onEnd);
    };
  }, [mounted, swipeToClose, placement]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      aria-labelledby={labelledBy}
      data-placement={placement}
      className="sheet"
      // Escape: animate out through the caller rather than vanish.
      onCancel={(event) => {
        event.preventDefault();
        onCloseRef.current();
      }}
    >
      <div ref={backdropRef} aria-hidden className={clsx("sheet-backdrop", backdropClassName)} onClick={() => onCloseRef.current()} />
      <div ref={panelRef} className={clsx("sheet-panel", className)}>
        {mounted ? lastChildren.current : null}
      </div>
      {decoration && <div className="pointer-events-none absolute inset-0">{decoration}</div>}
    </dialog>
  );
}
