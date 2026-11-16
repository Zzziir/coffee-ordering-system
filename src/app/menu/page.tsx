import { Suspense } from "react";
import { cookies } from "next/headers";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { MenuBrowser } from "@/components/menu-browser";
import { BranchGate } from "@/components/branch-picker";
import { getMenu } from "@/lib/menu-store";
import { BRANCH_COOKIE, isBranchId } from "@/lib/branches";

export const metadata = {
  title: "Menu · Craffé",
  description: "Espresso, frappés, Thai tea, refreshers, cookies, and more. Order ahead.",
};

// The menu is edited from the admin screen, so render it per request rather than
// baking it into the build.
export const dynamic = "force-dynamic";

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ b?: string }>;
}) {
  const [menu, params, cookieStore] = await Promise.all([getMenu(), searchParams, cookies()]);
  // The branch the browser will settle on: a scanned QR code's, else the one
  // remembered last visit. Drawing the menu for it here means nothing moves
  // when the page wakes up and drops what's sold out at that store.
  const remembered = cookieStore.get(BRANCH_COOKIE)?.value;
  const serverBranchId = isBranchId(params.b) ? params.b : isBranchId(remembered) ? remembered : null;
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
          <MenuBrowser menu={menu} serverBranchId={serverBranchId} />
        </Suspense>
      </main>

      <SiteFooter />

      {/* Nothing can be ordered without a branch, so ask before the menu
          rather than surprising anyone at checkout. */}
      <BranchGate />
    </div>
  );
}
