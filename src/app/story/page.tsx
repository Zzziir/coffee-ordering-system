import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  CoffeeBeanIcon,
  HeartIcon,
  HandHeartIcon,
} from "@phosphor-icons/react/dist/ssr";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { ChatLauncher } from "@/components/chat/chat-launcher";

export const metadata = {
  title: "Our Story · Craffé",
  description: "How Craffé grew from one neighborhood shop into a whole latte love.",
};

export default function StoryPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteNav />

      <main className="flex-1">
        {/* Intro */}
        <section className="mx-auto max-w-[820px] px-5 pb-4 pt-14 text-center lg:pt-20">
          <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-coffee">
            Our Story
          </p>
          <h1 className="mt-4 text-[clamp(2.4rem,6vw,4rem)] font-bold leading-[1.02] tracking-tight text-ink">
            More than coffee. It&apos;s a little ritual.
          </h1>
          <p className="mx-auto mt-6 max-w-[54ch] text-[18px] leading-relaxed text-ink-soft">
            Craffé started as a tiny coffee shop in Barangay Rizal, Makati.
            Back then we went by Craffé 1004, one counter with a single idea:
            seriously good coffee, served warm and fast, for the neighborhood
            right around us. That hasn&apos;t changed. There are just more
            counters to line up at now.
          </p>
        </section>

        {/* Feature image */}
        <section className="mx-auto max-w-[1080px] px-5 py-10 lg:px-8">
          <Reveal className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-card)]">
            <Image
              src="/brand/storefront-day.jpg"
              alt="The Craffé East Rembo storefront on 15th Ave"
              fill
              priority
              sizes="(max-width: 1080px) 100vw, 1080px"
              className="object-cover"
            />
          </Reveal>
        </section>

        {/* Narrative */}
        <section className="mx-auto grid max-w-[1080px] gap-10 px-5 py-8 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <Reveal>
            <h2 className="text-[clamp(1.7rem,3vw,2.25rem)] font-bold leading-tight tracking-tight text-ink">
              From one little shop to a whole lot of love
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-col gap-4 text-[16px] leading-relaxed text-ink-soft">
            <p>
              We pull our espresso fresh for every cup, stir our own syrups, and
              treat the small things, the crema, the ice, the first sip, like
              they matter. Because they do.
            </p>
            <p>
              What started as Craffé 1004 in Barangay Rizal is now two branches,
              Craffé East Rembo and Craffé by MYCC in Marilao, Bulacan, both with
              dine-in seating and a community of regulars who&apos;ve made Craffé
              part of their day. We&apos;re still that same little shop at heart:
              warm, quick, and genuinely glad you stopped by.
            </p>
          </Reveal>
        </section>

        {/* Values */}
        <section className="bg-ink text-paper">
          <div className="mx-auto max-w-[1080px] px-5 py-16 lg:px-8 lg:py-20">
            <Reveal>
              <h2 className="max-w-[18ch] text-[clamp(1.8rem,3.5vw,2.5rem)] font-bold leading-tight tracking-tight">
                What goes into every cup
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {[
                { icon: <CoffeeBeanIcon size={26} weight="fill" />, title: "Freshly pulled", body: "Espresso shots pulled to order, never sitting around." },
                { icon: <HandHeartIcon size={26} weight="fill" />, title: "Made by hand", body: "House syrups and creams, mixed by baristas who care." },
                { icon: <HeartIcon size={26} weight="fill" />, title: "For the 'hood", body: "Fair prices and a friendly counter for our neighbors." },
              ].map((v, i) => (
                <Reveal key={v.title} delay={i * 0.08}>
                  <span className="grid size-12 place-items-center rounded-full bg-coffee text-paper">
                    {v.icon}
                  </span>
                  <h3 className="mt-4 text-[18px] font-semibold">{v.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-paper/70">
                    {v.body}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-[820px] px-5 py-20 text-center">
          <Reveal>
            <h2 className="text-[clamp(1.9rem,4vw,2.75rem)] font-bold leading-tight tracking-tight text-ink">
              Taste it for yourself.
            </h2>
            <p className="mx-auto mt-4 max-w-[40ch] text-[16px] text-ink-soft">
              Order ahead at whichever branch is closest, or come say hi in
              person.
            </p>
            <Link
              href="/menu"
              className="pressable mt-7 inline-flex h-14 items-center gap-2 rounded-full bg-ink px-8 text-[16px] font-semibold text-paper"
            >
              Explore the menu
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
