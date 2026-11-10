"use client";

import type { ComponentProps, PointerEvent } from "react";
import { clsx } from "@/lib/clsx";

/**
 * A surface whose coffee glow follows the pointer (see `.spotlight` in
 * globals.css). The position is written straight onto this element's style,
 * not into React state, so moving the mouse never re-renders anything.
 */
export function Spotlight({ className, onPointerMove, ...props }: ComponentProps<"div">) {
  const track = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    if (event.pointerType !== "mouse") return;
    const el = event.currentTarget;
    const box = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${event.clientX - box.left}px`);
    el.style.setProperty("--spot-y", `${event.clientY - box.top}px`);
  };

  return <div {...props} onPointerMove={track} className={clsx("spotlight", className)} />;
}
