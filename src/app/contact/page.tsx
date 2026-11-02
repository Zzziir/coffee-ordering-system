import Image from "next/image";
import Link from "next/link";
import {
  MapPinIcon,
  ClockIcon,
  ChatCircleDotsIcon,
  FacebookLogoIcon,
  InstagramLogoIcon,
  StorefrontIcon,
  CoffeeIcon,
  HandshakeIcon,
  ConfettiIcon,
} from "@phosphor-icons/react/dist/ssr";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { ChatLauncher } from "@/components/chat/chat-launcher";
import { BentoGrid, BentoCard } from "@/components/bento";
import { Marquee } from "@/components/marquee";
import { InquiryForm } from "./inquiry-form";
import {
  BRANCH_LIST,
  branchAddress,
  branchFullName,
  hoursSummary,
  isOpen,
  openStatusLabel,
  type Branch,
} from "@/lib/branches";
import { CHANNEL_LABEL } from "@/lib/types";
import { signatureItems, peso } from "@/lib/menu";
import { getMenu } from "@/lib/menu-store";
import { clsx } from "@/lib/clsx";

export const metadata = {
  title: "Contact · Craffé",
  description:
    "Both Craffé branches: East Rembo, Makati and Craffé by MYCC in Marilao. Hours, locations, how to reach us, plus franchising and coffee cart bookings for weddings, debuts, and events.",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const signatures = signatureItems(await getMenu());
  const [flagship, partner] = BRANCH_LIST;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteNav />

      <main className="flex-1">
        <section className="mx-auto max-w-[820px] px-5 pb-2 pt-14 text-center lg:pt-20">
          <h1 className="text-[clamp(2.4rem,6vw,4rem)] font-bold leading-[1.02] tracking-tight text-ink">
            Come say hi.
          </h1>
          <p className="mx-auto mt-5 max-w-[46ch] text-[18px] leading-relaxed text-ink-soft">
            Two Craffés, one menu. Order ahead at whichever is closest and
            we&apos;ll have it ready when you arrive.
          </p>
        </section>

        <section className="mx-auto max-w-[1080px] px-5 py-10 lg:px-8 lg:py-14">
          <Reveal>
            <BentoGrid>
              {/* The original gets the wide cell and the only photograph. */}
              <BranchCell
                branch={flagship}
                className="lg:col-span-2"
                background={
                  <>
                    <Image
                      src="/brand/storefront-day.jpg"
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 100vw, 700px"
                      className="object-cover object-center [mask-image:linear-gradient(to_left,#000_8%,transparent_62%)]"
                    />
                    <span className="absolute inset-0 bg-gradient-to-r from-paper-raised from-40% via-paper-raised/70 to-transparent" />
                  </>
                }
              />

              <BranchCell
                branch={partner}
                className="md:col-span-2 lg:col-span-1"
                background={
                  <span className="absolute -right-16 -top-16 size-56 rounded-full bg-coffee-tint/70 blur-2xl" />
                }
              />

              <BentoCard
                name="Reach us"
                description="Message us on Facebook or Instagram, or ask the barista bot anything about the menu."
                icon={ChatCircleDotsIcon}
                className="md:col-span-1"
                background={
                  <span className="absolute -bottom-20 -left-12 size-56 rounded-full bg-coffee-tint/60 blur-2xl" />
                }
              >
                <div className="flex gap-2.5">
                  <SocialLink href="https://www.facebook.com/" label="Craffé on Facebook">
                    <FacebookLogoIcon size={19} weight="fill" />
                  </SocialLink>
                  <SocialLink href="https://www.instagram.com/" label="Craffé on Instagram">
                    <InstagramLogoIcon size={19} weight="fill" />
                  </SocialLink>
                </div>
              </BentoCard>

              {/* Signature drinks drift past behind the order CTA. */}
              <BentoCard
                name="One menu, both branches"
                description="Same drinks, same prices, wherever you scan. Build your order and skip the line."
                icon={CoffeeIcon}
                href="/menu"
                cta="Start your order"
                className="md:col-span-1 lg:col-span-2"
                background={
                  <>
                    {/* Only the lg row height leaves a clear band between the
                        copy and the CTA. Below that the cell packs down and the
                        text is the point, so the decoration sits it out. */}
                    <Marquee
                      className="absolute inset-x-0 bottom-[5.5rem] hidden lg:flex [mask-image:linear-gradient(to_right,transparent,#000_16%,#000_84%,transparent)]"
                      duration={46}
                    >
                      {signatures.map((item) => (
                        <span
                          key={item.id}
                          className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-[13px] font-medium text-ink-soft"
                        >
                          {item.name}
                          <span className="tabular-nums text-coffee">{peso(item.price)}</span>
                        </span>
                      ))}
                    </Marquee>
                    <span className="absolute inset-x-0 bottom-0 hidden h-20 bg-gradient-to-t from-paper-raised via-paper-raised/90 to-transparent lg:block" />
                  </>
                }
              />
            </BentoGrid>
          </Reveal>
        </section>

        {/* Work with Craffé — franchising and event coffee carts. The copy below
            is placeholder: swap in real inclusions, packages, coverage, and any
            pricing once they're settled. */}
        <section id="partner" className="relative scroll-mt-24 overflow-hidden border-t border-line bg-paper-sunk/40">
          {/* Warm depth: soft brand-tinted glows behind the content. */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -left-28 top-8 size-80 rounded-full bg-coffee/10 blur-3xl" />
            <div className="absolute -right-24 bottom-0 size-96 rounded-full bg-gold/10 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-[1120px] px-5 py-16 lg:px-8 lg:py-24">
            <Reveal>
              <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-16">
                {/* The pitch */}
                <div>
                  <p className="inline-flex items-center gap-2 rounded-full border border-coffee/20 bg-coffee/5 px-3 py-1 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-coffee">
                    <StorefrontIcon size={14} weight="fill" />
                    Work with Craffé
                  </p>
                  <h2 className="mt-4 text-[clamp(2rem,4.5vw,3rem)] font-bold leading-[1.05] tracking-tight text-ink">
                    Bring Craffé to more people.
                  </h2>
                  <p className="mt-4 max-w-[48ch] text-[17px] leading-relaxed text-ink-soft">
                    A café of your own, or a coffee cart at your celebration. Two
                    ways to grow with us, one conversation to start it.
                  </p>

                  {/* Proof strip */}
                  <dl className="mt-8 grid grid-cols-3 gap-4 border-y border-line/70 py-5">
                    <Stat value="2" label="branches" />
                    <Stat value="3,000+" label="regulars" />
                    <Stat value="2" label="ways to grow" />
                  </dl>

                  <div className="mt-8 flex flex-col gap-4">
                    <OfferCard
                      icon={HandshakeIcon}
                      title="Franchise a Craffé"
                      body="Open your own branch with our recipes, training, and branding behind you. Tell us where you're thinking and we'll walk you through what it takes."
                    />
                    <OfferCard
                      icon={ConfettiIcon}
                      title="Book a coffee cart"
                      body="Freshly pulled espresso for weddings, debuts, and corporate events. Share your date and headcount and we'll put a package together."
                    />
                  </div>

                  {/* A real storefront, so the pitch feels like a place. */}
                  <div className="relative mt-6 hidden aspect-[16/8] overflow-hidden rounded-[var(--radius-lg)] border border-line lg:block">
                    <Image
                      src="/brand/storefront-day.jpg"
                      alt="A Craffé storefront by day"
                      fill
                      sizes="560px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                    <p className="absolute bottom-4 left-5 flex items-center gap-2 text-[14px] font-medium text-white">
                      <MapPinIcon size={16} weight="fill" />
                      Your Craffé could be next.
                    </p>
                  </div>
                </div>

                {/* The form */}
                <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-line bg-paper-raised shadow-[var(--shadow-pop)]">
                  {/* Accent sheen along the top edge. */}
                  <div aria-hidden className="h-1 w-full bg-gradient-to-r from-coffee via-gold to-coffee" />
                  <div className="p-6 lg:p-8">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-gradient-to-br from-coffee to-coffee-deep text-paper shadow-[var(--shadow-card)]">
                        <ChatCircleDotsIcon size={20} weight="fill" />
                      </span>
                      <div>
                        <h3 className="text-[20px] font-semibold leading-tight tracking-tight text-ink">
                          Tell us what you have in mind
                        </h3>
                        <p className="mt-0.5 text-[14px] leading-relaxed text-ink-soft">
                          Pick what fits and we&apos;ll take it from there.
                        </p>
                      </div>
                    </div>
                    <div className="mt-6">
                      <InquiryForm />
                    </div>
                  </div>
                </div>
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

/** One branch, with the things someone standing outside actually needs. */
function BranchCell({
  branch,
  className,
  background,
}: {
  branch: Branch;
  className?: string;
  background?: React.ReactNode;
}) {
  const open = isOpen(branch);

  return (
    <BentoCard
      name={branchFullName(branch)}
      icon={StorefrontIcon}
      href={branch.mapsUrl}
      cta="Open in Google Maps"
      external
      className={className}
      background={background}
    >
      <div className="flex flex-col gap-3">
        <p className="flex items-start gap-2 text-[14.5px] leading-relaxed text-ink">
          <MapPinIcon size={17} weight="fill" className="mt-0.5 shrink-0 text-coffee" />
          {branchAddress(branch)}
        </p>

        <p
          className={clsx(
            "inline-flex items-center gap-2 text-[13px] font-medium",
            open ? "text-ready" : "text-ink-faint",
          )}
        >
          <span className={clsx("size-1.5 rounded-full", open ? "bg-ready" : "bg-ink-faint")} />
          {openStatusLabel(branch)}
        </p>

        <div className="flex items-start gap-2 text-[14px] text-ink-soft">
          <ClockIcon size={17} weight="fill" className="mt-0.5 shrink-0 text-coffee" />
          <span>
            {hoursSummary(branch).map((line) => (
              <span key={line} className="block tabular-nums">
                {line}
              </span>
            ))}
          </span>
        </div>

        <ul className="flex flex-wrap gap-1.5">
          {branch.channels.map((channel) => (
            <li
              key={channel}
              className="rounded-full bg-paper-sunk px-2.5 py-1 text-[12px] font-medium text-ink-soft"
            >
              {CHANNEL_LABEL[channel]}
            </li>
          ))}
        </ul>
      </div>
    </BentoCard>
  );
}

/** One offering in the "Work with Craffé" pitch: an icon, a title, and a line. */
function OfferCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ size?: number; weight?: "fill"; className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="group flex gap-4 rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5 transition-all duration-300 hover:border-coffee/30 hover:shadow-[var(--shadow-card)]">
      <span className="grid size-12 shrink-0 place-items-center rounded-[var(--radius-md)] bg-gradient-to-br from-coffee to-coffee-deep text-paper shadow-[var(--shadow-card)] transition-transform duration-300 group-hover:scale-105">
        <Icon size={23} weight="fill" />
      </span>
      <div>
        <h3 className="text-[16px] font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-[14.5px] leading-relaxed text-ink-soft">{body}</p>
      </div>
    </div>
  );
}

/** A single proof point in the "Work with Craffé" strip. */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="text-[clamp(1.5rem,2.5vw,1.9rem)] font-bold leading-none tracking-tight text-ink">
        {value}
      </dt>
      <dd className="mt-1.5 text-[13px] text-ink-soft">{label}</dd>
    </div>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      target="_blank"
      rel="noreferrer"
      className="pressable grid size-10 place-items-center rounded-full bg-ink text-paper transition-colors hover:bg-coffee-deep"
    >
      {children}
    </Link>
  );
}
