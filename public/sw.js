/*
  Craffé service worker.

  Deliberately small. Ordering needs live data (menu availability, prices,
  order status, sign-in), so pages and API calls always go to the network and
  are never served from cache. The worker only does two things:

    1. Shows a branded offline page when a page load fails.
    2. Keeps build assets and brand photos on the device so repeat visits
       paint fast on a weak mobile connection.

  Bump VERSION to drop every cache on the next visit.
*/
const VERSION = "v1";
const SHELL_CACHE = `craffe-shell-${VERSION}`;
const ASSET_CACHE = `craffe-assets-${VERSION}`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Content-hashed by the build, so a cached copy can never be stale.
const isBuildAsset = (url) => url.pathname.startsWith("/_next/static/");

// Static files from /public that change rarely: serve the cached copy at once
// and refresh it in the background.
const isBrandAsset = (url) =>
  /^\/(brand|menu|icons)\/.+\.(?:jpe?g|png|webp|avif|svg)$/.test(url.pathname);

async function cacheFirst(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  const refreshed = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached ?? refreshed;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  if (isBuildAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (isBrandAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
  // Everything else (API routes, the order status stream, auth) falls through
  // to the network untouched.
});
