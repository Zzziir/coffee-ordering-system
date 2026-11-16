"use client";

import { useLayoutEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type StackDirection = "push" | "pop";

const TYPE: Record<StackDirection, string> = { push: "nav-forward", pop: "nav-back" };

/** If the next page hasn't rendered by then, stop holding the old frame. */
const MAX_WAIT_MS = 1500;

/** Ends the transition in flight once the new route has rendered. */
let settle: (() => void) | null = null;

type TypedViewTransitionDocument = Document & {
  startViewTransition?: (
    arg: (() => Promise<void>) | { update: () => Promise<void>; types: string[] },
  ) => unknown;
};

/**
 * Slides the page body as the app moves one level deeper (push) or back up
 * (pop), the way a native navigation stack does. Call it right before the
 * navigation starts. The browser freezes the old frame, the router renders the
 * new route, and StackNavigationListener lets the slide play once it's there.
 *
 * Only these calls animate. Tab switches swap instantly, as native tabs do, and
 * the browser's own back and forward (the iOS edge swipe) are left alone, since
 * the system already animates those.
 */
export function startStackTransition(direction: StackDirection) {
  const doc = document as TypedViewTransitionDocument;
  if (!doc.startViewTransition) return;

  settle?.();
  let resolve!: () => void;
  const rendered = new Promise<void>((done) => {
    resolve = done;
    setTimeout(done, MAX_WAIT_MS);
  });
  settle = resolve;
  try {
    doc.startViewTransition({ update: () => rendered, types: [TYPE[direction]] });
  } catch {
    // Browsers without transition types: no slide, the page just swaps.
    resolve();
  }
}

/** Mounted once in the root layout: tells a pending slide the new route is in. */
export function StackNavigationListener() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    settle?.();
    settle = null;
  }, [pathname]);
  return null;
}

/** A link that pushes onto, or pops off, a navigation stack. */
export function StackLink({
  direction,
  ...props
}: React.ComponentProps<typeof Link> & { direction: StackDirection }) {
  return <Link {...props} onNavigate={() => startStackTransition(direction)} />;
}
