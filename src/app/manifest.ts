import type { MetadataRoute } from "next";

// Paper, from the design tokens in globals.css. The splash screen and the
// standalone status bar both take this, so launch blends into the first paint.
const PAPER = "#f6f3ec";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Craffé Coffee",
    short_name: "Craffé",
    description:
      "Skip the line at Craffé. Order and pay ahead, pick up at the window when it's ready.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: PAPER,
    theme_color: PAPER,
    lang: "en",
    categories: ["food", "shopping"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Order from the menu", short_name: "Menu", url: "/menu" },
      { name: "Your bag", short_name: "Bag", url: "/cart" },
    ],
  };
}
