import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { GalleryGrid, type GalleryPhoto } from "@/components/gallery-grid";
import { ChatLauncher } from "@/components/chat/chat-launcher";

export const metadata = {
  title: "Gallery · Craffé",
  description: "Drinks, pastries, and moments from the Craffé window.",
};

const PHOTOS: GalleryPhoto[] = [
  { src: "/brand/hero-drinks.jpg", alt: "Three Craffé signature drinks in warm light", span: "lg:col-span-2 lg:row-span-2", ratio: "aspect-[4/5] lg:aspect-auto" },
  { src: "/brand/storefront-day.jpg", alt: "The Craffé storefront by day", span: "", ratio: "aspect-[4/3]" },
  { src: "/brand/truffles.jpg", alt: "Trays of dusted chocolate truffles", span: "", ratio: "aspect-[4/3]" },
  { src: "/brand/team.jpg", alt: "The Craffé team outside the shop", span: "lg:col-span-2", ratio: "aspect-[16/10]" },
  { src: "/brand/sign-dusk.jpg", alt: "The glowing Craffé sign at dusk", span: "", ratio: "aspect-[4/3]" },
];

export default function GalleryPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteNav />

      <main className="flex-1">
        <section className="mx-auto max-w-[820px] px-5 pb-4 pt-14 text-center lg:pt-20">
          <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-coffee">
            Gallery
          </p>
          <h1 className="mt-4 text-[clamp(2.4rem,6vw,4rem)] font-bold leading-[1.02] tracking-tight text-ink">
            Moments &amp; memories
          </h1>
          <p className="mx-auto mt-6 max-w-[48ch] text-[18px] leading-relaxed text-ink-soft">
            A little look at the drinks, the sweets, and the corners we call
            home.
          </p>
        </section>

        <section className="mx-auto max-w-[1280px] px-5 py-10 lg:px-8">
          <GalleryGrid photos={PHOTOS} />
        </section>

        <section className="mx-auto max-w-[820px] px-5 py-16 text-center">
          <Reveal>
            <h2 className="text-[clamp(1.7rem,3.5vw,2.4rem)] font-bold tracking-tight text-ink">
              Hungry yet?
            </h2>
            <Link
              href="/menu"
              className="pressable mt-6 inline-flex h-14 items-center gap-2 rounded-full bg-ink px-8 text-[16px] font-semibold text-paper"
            >
              See the menu
              <ArrowRightIcon size={18} weight="bold" />
            </Link>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
      <ChatLauncher />
    </div>
  );
}
