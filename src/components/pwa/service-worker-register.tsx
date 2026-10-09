"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (public/sw.js) that powers the offline page and
 * the asset cache. Production only: in dev a caching worker gets in the way of
 * hot reload and serves stale chunks.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((error) => console.error("Service worker registration failed", error));
  }, []);

  return null;
}
