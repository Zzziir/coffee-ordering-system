import { Suspense } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { MenuBrowser } from "@/components/menu-browser";
import { BranchGate } from "@/components/branch-picker";

export const metadata = {
  title: "Menu · Craffé",
  description: "Espresso, frappés, Thai tea, refreshers, cookies, and more. Order ahead.",
};

export default function MenuPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteNav />

      <div className="mx-auto w-full max-w-[1280px] px-5 pt-10 lg:px-8 lg:pt-14">
        <h1 className="text-[clamp(2.4rem,5vw,3.5rem)] font-bold leading-[1.02] tracking-tight text-ink">
          The menu
        </h1>
        <p className="mt-3 max-w-[52ch] text-[17px] leading-relaxed text-ink-soft">
          Tap any drink to pick your size, milk, and extras. Your bag totals up as
          you go.
        </p>
      </div>

      <main className="flex-1">
        <Suspense fallback={null}>
          <MenuBrowser />
        </Suspense>
      </main>

      <SiteFooter />

      {/* Nothing can be ordered without a branch, so ask before the menu
          rather than surprising anyone at checkout. */}
      <BranchGate />
    </div>
  );
}
