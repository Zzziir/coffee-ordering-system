import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { LoyaltyMigrator } from "@/components/loyalty-migrator";

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

// Applies the saved dashboard theme before first paint, so a staff member who
// chose dark never sees a light flash on reload. Dark styling is scoped to the
// dashboard (.dashboard-surface), so this class is inert on customer pages.
const THEME_INIT = `try{if(localStorage.getItem('craffe-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full`}>
      <body className="min-h-full antialiased">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <CartProvider>{children}</CartProvider>
        <LoyaltyMigrator />
      </body>
    </html>
  );
}
