"use client";

import { useEffect, useRef } from "react";
import type { Order } from "@/lib/types";

/**
 * Subscribe to the live order stream (SSE). Calls `onOrder` for each order
 * change. Auto-reconnects via the browser's built-in EventSource retry.
 */
export function useOrderStream(onOrder: (order: Order) => void) {
  const cb = useRef(onOrder);
  cb.current = onOrder;

  useEffect(() => {
    const es = new EventSource("/api/stream");
    const handler = (e: MessageEvent) => {
      try {
        cb.current(JSON.parse(e.data) as Order);
      } catch {
        /* ignore malformed frame */
      }
    };
    es.addEventListener("order", handler);
    return () => {
      es.removeEventListener("order", handler);
      es.close();
    };
  }, []);
}
