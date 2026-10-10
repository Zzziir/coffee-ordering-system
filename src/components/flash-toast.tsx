"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "./toast";

/**
 * A save that ends in a redirect can't raise a toast itself: the page it ran
 * on is gone. The action redirects with `?notice=<code>` instead, and this
 * shows the matching message on arrival, then drops the param so a refresh or
 * a shared link doesn't repeat it. Only known codes are shown, so the URL can
 * never put arbitrary text on screen.
 */
const NOTICES: Record<string, string> = {
  "item-added": "Item added to the menu.",
  "item-saved": "Menu item saved.",
  "event-created": "Event created. You can ring up sales against it now.",
  "event-saved": "Event details saved.",
};

export function FlashToast() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const code = params.get("notice");
  // Guards the double effect run in development.
  const shown = useRef<string | null>(null);

  useEffect(() => {
    if (!code || shown.current === code) return;
    shown.current = code;

    const message = NOTICES[code];
    if (message) toast.success(message);

    const rest = new URLSearchParams(params);
    rest.delete("notice");
    const query = rest.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [code, params, pathname, router, toast]);

  return null;
}
