import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Craffé · Order Ahead",
  description:
    "Skip the line at Craffé. Order and pay ahead, pick up at the window when it's ready.",
  applicationName: "Craffé",
  appleWebApp: { capable: true, title: "Craffé", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f6f3ec",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full`}>
      <body className="min-h-full antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
