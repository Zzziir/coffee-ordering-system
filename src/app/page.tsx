import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  ClockIcon,
  CoffeeIcon,
  CreditCardIcon,
  QrCodeIcon,
  GiftIcon,
  MapPinIcon,
  StarIcon,
} from "@phosphor-icons/react/dist/ssr";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { ChatLauncher } from "@/components/chat/chat-launcher";
import { CupMark } from "@/components/brand";
import { ItemThumb } from "@/components/item-thumb";
import { signatureItems, peso } from "@/lib/menu";
import { BRANCH_LIST, branchAddress, branchFullName, openStatusLabel } from "@/lib/branches";
import { DiaTextReveal, revealLength } from "@/components/dia-text-reveal";

const rise = (delay: number) => ({
  animation: "craffe-rise 0.7s var(--ease-out) both",
  animationDelay: `${delay}ms`,
});

/** Split so "love" can carry the coffee accent while the wave runs unbroken. */
const HEADLINE = {
  top: "A whole latte",
  accent: "love",
  tail: ", in every cup.",
};

export default function HomePage() {
  const favorites = signatureItems().slice(0, 4);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteNav />

      <main className="flex-1">
        {/* ---------- Hero ---------- */}
        <section className="mx-auto grid max-w-[1280px] items-center gap-10 px-5 pb-8 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:pb-16 lg:pt-16">
          <div>
            <span
              className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-paper-raised px-3.5 py-1.5 text-[13px] font-medium text-ink-soft"
              style={rise(0)}
            >
              <CupMark className="size-3.5 text-coffee" />
              {BRANCH_LIST.length} branches · Makati &amp; Bulacan
            </span>
            {/* The heading carries the real sentence; the reveal spans inside
                are hidden from assistive tech and animate per character. */}
            <h1
              aria-label={`${HEADLINE.top} ${HEADLINE.accent}${HEADLINE.tail}`}
              className="mt-5 text-[clamp(3rem,7vw,5.25rem)] font-bold leading-[0.95] tracking-tight text-ink"
            >
              <DiaTextReveal text={HEADLINE.top} delay={70} />
              <br />
              <DiaTextReveal
                text={HEADLINE.accent}
                className="text-coffee"
                delay={70}
                startIndex={revealLength(HEADLINE.top)}
              />
              <DiaTextReveal
                text={HEADLINE.tail}
                delay={70}
                startIndex={revealLength(HEADLINE.top) + revealLength(HEADLINE.accent)}
              />
            </h1>
            <p
              className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-ink-soft lg:text-[19px]"
              style={rise(140)}
            >
              Handcrafted espresso, frappés, and Dubai chewy cookies. Order and
              pay ahead, then skip the line and pick up at the window.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3" style={rise(210)}>
              <Link
                href="/menu"
                className="pressable inline-flex h-14 items-center gap-2 rounded-full bg-ink px-8 text-[16px] font-semibold text-paper shadow-[var(--shadow-pop)]"
              >
                Order now
                <ArrowRightIcon size={19} weight="bold" />
              </Link>
              <Link
                href="/story"
                className="pressable inline-flex h-14 items-center rounded-full border border-line-strong px-7 text-[16px] font-medium text-ink"
              >
                Our story
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-3" style={rise(280)}>
              <div className="flex text-coffee">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} size={17} weight="fill" />
                ))}
              </div>
              <p className="text-[14px] text-ink-soft">
                Loved by <span className="font-semibold text-ink">3,000+</span>{" "}
                regulars across our branches
              </p>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative" style={rise(160)}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-card)] lg:aspect-[4/4.6]">
              <Image
                src="/brand/hero-drinks.jpg"
                alt="Three Craffé signature drinks on the counter in warm afternoon light"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-cover"
              />
            </div>
            {/* floating badge */}
            <div className="absolute -bottom-4 -left-3 flex items-center gap-3 rounded-2xl border border-line bg-paper-raised/95 px-4 py-3 shadow-[var(--shadow-pop)] backdrop-blur-sm sm:-left-6">
              <span className="grid size-10 place-items-center rounded-full bg-coffee-tint text-coffee">
                <QrCodeIcon size={22} weight="regular" />
              </span>
              <div>
                <p className="text-[14px] font-semibold leading-tight text-ink">
                  Order in 3 taps
                </p>
                <p className="text-[12.5px] text-ink-soft">No line, no wait</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Value row ---------- */}
        <section className="mx-auto max-w-[1280px] px-5 py-10 lg:px-8">
          <Reveal className="grid divide-y divide-line rounded-[var(--radius-lg)] border border-line bg-paper-raised sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              { icon: <QrCodeIcon size={26} />, title: "Skip the line", body: "Scan the QR or open the link and order from your phone." },
              { icon: <CreditCardIcon size={26} />, title: "Pay ahead", body: "GCash, card, or cash. Settle up before you even arrive." },
              { icon: <CoffeeIcon size={26} />, title: "Made fresh", body: "We start once you order, so it's hot (or ice-cold) and ready." },
            ].map((v) => (
              <div key={v.title} className="flex flex-col gap-2 p-6 lg:p-8">
                <span className="text-coffee">{v.icon}</span>
                <h3 className="mt-1 text-[17px] font-semibold text-ink">{v.title}</h3>
                <p className="text-[14.5px] leading-relaxed text-ink-soft">{v.body}</p>
              </div>
            ))}
          </Reveal>
        </section>

        {/* ---------- Fan favorites ---------- */}
        <section className="mx-auto max-w-[1280px] px-5 py-12 lg:px-8 lg:py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-[clamp(1.9rem,4vw,2.75rem)] font-bold tracking-tight text-ink">
                Fan favorites
              </h2>
              <p className="mt-2 max-w-[42ch] text-[16px] text-ink-soft">
                The ones regulars keep coming back for.
              </p>
            </div>
            <Link
              href="/menu"
              className="pressable hidden shrink-0 items-center gap-1.5 rounded-full border border-line-strong px-5 py-2.5 text-[15px] font-medium text-ink sm:inline-flex"
            >
              Full menu
              <ArrowRightIcon size={16} weight="bold" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
            {favorites.map((item, i) => (
              <Reveal key={item.id} delay={i * 0.06} as="div">
                <Link
                  href={`/menu?item=${item.id}`}
                  className="pressable group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line bg-paper-raised"
                >
                  <div className="relative aspect-[5/4] overflow-hidden">
                    <ItemThumb item={item} iconClassName="size-16" sizes="(max-width: 1024px) 50vw, 300px" />
                    <span className="absolute left-3 top-3 rounded-full bg-paper/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-coffee-deep backdrop-blur-sm">
                      Signature
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-[16px] font-semibold leading-tight text-ink">
                      {item.name}
                    </h3>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <span className="text-[16px] font-semibold text-ink">
                        {peso(item.price)}
                      </span>
                      <span className="grid size-9 place-items-center rounded-full bg-ink text-paper transition-colors group-hover:bg-coffee">
                        <ArrowUpRightIcon size={17} weight="bold" />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- Our story (dark band) ---------- */}
        <section className="bg-ink text-paper">
          <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
            <Reveal className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)]">
              <Image
                src="/brand/team.jpg"
                alt="The Craffé team outside the shop"
                fill
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-cover"
              />
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-coffee">
                Our story
              </p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight">
                More than coffee. It&apos;s a little ritual.
              </h2>
              <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-paper/70">
                Craffé started as a neighborhood window on 15th Ave with one
                idea: seriously good coffee, served warm and fast, for the people
                right around us. A second shop later, that&apos;s still the whole
                plan — freshly pulled espresso, house syrups, and a menu
                we&apos;re always tinkering with.
              </p>
              <Link
                href="/story"
                className="pressable mt-7 inline-flex items-center gap-2 rounded-full bg-paper px-6 py-3 text-[15px] font-semibold text-ink"
              >
                Read our story
                <ArrowRightIcon size={17} weight="bold" />
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ---------- Gallery strip ---------- */}
        <section className="mx-auto max-w-[1280px] px-5 py-16 lg:px-8 lg:py-24">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-[clamp(1.9rem,4vw,2.75rem)] font-bold tracking-tight text-ink">
              Moments at Craffé
            </h2>
            <Link
              href="/gallery"
              className="pressable hidden shrink-0 items-center gap-1.5 text-[15px] font-medium text-coffee sm:inline-flex"
            >
              See the gallery
              <ArrowRightIcon size={16} weight="bold" />
            </Link>
          </div>
          <Reveal className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <GalleryTile src="/brand/storefront-day.jpg" alt="The Craffé storefront by day" className="col-span-2 aspect-[4/3] lg:col-span-2 lg:row-span-2 lg:aspect-auto" />
            <GalleryTile src="/brand/truffles.jpg" alt="Trays of chocolate truffles" className="aspect-square" />
            <GalleryTile src="/brand/sign-dusk.jpg" alt="The Craffé sign at dusk" className="aspect-square" />
            <GalleryTile src="/brand/hero-drinks.jpg" alt="Three signature drinks" className="col-span-2 aspect-[2/1] lg:col-span-2 lg:aspect-[2.1/1]" />
          </Reveal>
        </section>

        {/* ---------- Rewards band ---------- */}
        <section className="mx-auto max-w-[1280px] px-5 lg:px-8">
          <Reveal className="overflow-hidden rounded-[var(--radius-xl)] border border-line bg-coffee-tint">
            <div className="grid items-center gap-8 p-8 lg:grid-cols-[1.3fr_1fr] lg:p-14">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-paper-raised px-3.5 py-1.5 text-[13px] font-medium text-coffee-deep">
                  <GiftIcon size={16} weight="fill" />
                  Craffé Rewards
                </span>
                <h2 className="mt-4 text-[clamp(1.9rem,4vw,2.75rem)] font-bold leading-tight tracking-tight text-ink">
                  Buy nine, the tenth is on us.
                </h2>
                <p className="mt-4 max-w-[44ch] text-[16px] leading-relaxed text-ink-soft">
                  Every order stamps your digital card automatically. No app, no
                  plastic card to lose, just free coffee on the way.
                </p>
                <Link
                  href="/menu"
                  className="pressable mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-paper"
                >
                  Start earning
                  <ArrowRightIcon size={17} weight="bold" />
                </Link>
              </div>
              <div className="grid grid-cols-5 gap-2.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="grid aspect-square place-items-center rounded-full border border-coffee/30 bg-paper-raised/60 text-coffee"
                  >
                    {i === 9 ? (
                      <GiftIcon size={18} weight="regular" className="text-coffee/50" />
                    ) : (
                      <CoffeeIcon size={18} weight={i < 4 ? "fill" : "regular"} className={i < 4 ? "" : "text-coffee/40"} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* ---------- Visit / final CTA ---------- */}
        <section className="mx-auto max-w-[1280px] px-5 py-16 lg:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-card)]">
              <Image
                src="/brand/sign-dusk.jpg"
                alt="The glowing Craffé sign at dusk"
                fill
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-cover"
              />
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight text-ink">
                Come see us.
              </h2>
              <div className="mt-6 flex flex-col gap-4">
                {BRANCH_LIST.map((branch) => (
                  <p key={branch.id} className="flex items-start gap-3 text-[16px] text-ink">
                    <MapPinIcon size={22} weight="fill" className="mt-0.5 shrink-0 text-coffee" />
                    <span>
                      {branchFullName(branch)}
                      <span className="block text-[14.5px] text-ink-soft">
                        {branchAddress(branch)} · {openStatusLabel(branch)}
                      </span>
                    </span>
                  </p>
                ))}
                <p className="flex items-start gap-3 text-[15px] text-ink-soft">
                  <ClockIcon size={22} weight="fill" className="mt-0.5 shrink-0 text-coffee" />
                  Full hours for every branch are on the{" "}
                  <Link href="/contact" className="font-medium text-coffee underline-offset-2 hover:underline">
                    contact page
                  </Link>
                  .
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/menu"
                  className="pressable inline-flex h-[52px] items-center gap-2 rounded-full bg-ink px-7 text-[15px] font-semibold text-paper"
                >
                  Order ahead
                  <ArrowRightIcon size={17} weight="bold" />
                </Link>
                <Link
                  href="/contact"
                  className="pressable inline-flex h-[52px] items-center rounded-full border border-line-strong px-6 text-[15px] font-medium text-ink"
                >
                  Get directions
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
      <ChatLauncher />
    </div>
  );
}

function GalleryTile({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[var(--radius-md)] ${className ?? ""}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 50vw, 320px"
        className="object-cover transition-transform duration-500 hover:scale-105"
      />
    </div>
  );
}
