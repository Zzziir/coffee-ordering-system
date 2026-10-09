import type { NextConfig } from "next";

// Menu photos are served from the Supabase Storage public bucket, so next/image
// has to be told that host is allowed.
const supabaseHost = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://rdfdoyqueynwddswgbwk.supabase.co",
).hostname;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // The service worker must never be served stale, or a fix to it could
        // take a day to reach installed phones.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  experimental: {
    // Menu photo uploads go through a Server Action; the 1 MB default is too small.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
