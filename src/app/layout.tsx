import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { LoyaltyMigrator } from "@/components/loyalty-migrator";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

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
  // Lets the page reach the screen edges on notched phones, which is what
  // makes env(safe-area-inset-*) report real values for the bottom bars.
  viewportFit: "cover",
};

// Applies the saved theme before first paint, so anyone who chose dark never
// sees a light flash on reload. `.dark` flips the tokens site-wide (globals.css)
// and we move the browser-chrome colour to match in the same breath.
const THEME_INIT = `try{if(localStorage.getItem('craffe-theme')==='dark'){document.documentElement.classList.add('dark');var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','#1b1a17')}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full`}>
      <body className="min-h-full antialiased">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <CartProvider>
          {children}
          <MobileTabBar />
        </CartProvider>
        <LoyaltyMigrator />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
