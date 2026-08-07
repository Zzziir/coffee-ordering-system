import Image from "next/image";
import Link from "next/link";
import {
  MapPinIcon,
  ClockIcon,
  ChatCircleDotsIcon,
  FacebookLogoIcon,
  InstagramLogoIcon,
  ArrowUpRightIcon,
  StorefrontIcon,
} from "@phosphor-icons/react/dist/ssr";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { ChatLauncher } from "@/components/chat/chat-launcher";

export const metadata = {
  title: "Contact — Craffé",
  description: "Find Craffé in East Rembo, Makati. Hours, location, and how to reach us.",
};

const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Craffe+East+Rembo+15th+Ave+JP+Rizal";

export default function ContactPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteNav />

      <main className="flex-1">
        <section className="mx-auto max-w-[820px] px-5 pb-4 pt-14 text-center lg:pt-20">
          <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-coffee">
            Contact
          </p>
          <h1 className="mt-4 text-[clamp(2.4rem,6vw,4rem)] font-bold leading-[1.02] tracking-tight text-ink">
            Come say hi.
          </h1>
          <p className="mx-auto mt-6 max-w-[46ch] text-[18px] leading-relaxed text-ink-soft">
            You&apos;ll find us at the window on 15th Ave. Order ahead and we&apos;ll
            have it ready when you arrive.
          </p>
        </section>

        <section className="mx-auto max-w-[1080px] px-5 py-10 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            {/* Info */}
            <Reveal className="flex flex-col gap-4">
              <InfoCard icon={<MapPinIcon size={22} weight="fill" />} title="Where">
                <p className="text-ink">Craffé East Rembo</p>
                <p className="text-ink-soft">15th Ave JP Rizal Ext., Makati City</p>
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="pressable mt-2 inline-flex items-center gap-1 text-[14.5px] font-medium text-coffee"
                >
                  Open in Google Maps
                  <ArrowUpRightIcon size={15} weight="bold" />
                </a>
              </InfoCard>

              <InfoCard icon={<ClockIcon size={22} weight="fill" />} title="When">
                <p className="text-ink">Mon–Thu · 7:30am – 11:00pm</p>
                <p className="text-ink">Fri–Sun · 7:30am – 12:00am</p>
                <p className="mt-1 text-[14px] text-ink-soft">
                  Craffé 1004, Brgy. Rizal · 1:00pm – 9:00pm
                </p>
              </InfoCard>

              <InfoCard icon={<ChatCircleDotsIcon size={22} weight="fill" />} title="Reach us">
                <p className="text-ink-soft">
                  Message us on Facebook or Instagram, or ask our chatbot anything
                  about the menu.
                </p>
                <div className="mt-3 flex gap-2.5">
                  <a href="https://www.facebook.com/" aria-label="Facebook" className="pressable grid size-10 place-items-center rounded-full bg-ink text-paper">
                    <FacebookLogoIcon size={19} weight="fill" />
                  </a>
                  <a href="https://www.instagram.com/" aria-label="Instagram" className="pressable grid size-10 place-items-center rounded-full bg-ink text-paper">
                    <InstagramLogoIcon size={19} weight="fill" />
                  </a>
                </div>
              </InfoCard>
            </Reveal>

            {/* Photo + directions */}
            <Reveal delay={0.1} className="flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-line bg-paper-raised">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/brand/storefront-day.jpg"
                  alt="The Craffé storefront on 15th Ave"
                  fill
                  sizes="(max-width: 1024px) 100vw, 540px"
                  className="object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-2.5">
                  <StorefrontIcon size={22} weight="fill" className="text-coffee" />
                  <p className="text-[15px] font-medium text-ink">Look for the takeout window</p>
                </div>
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="pressable inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[14px] font-semibold text-paper"
                >
                  Directions
                  <ArrowUpRightIcon size={15} weight="bold" />
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-[820px] px-5 py-16 text-center">
          <Reveal>
            <h2 className="text-[clamp(1.7rem,3.5vw,2.4rem)] font-bold tracking-tight text-ink">
              Or just order ahead.
            </h2>
            <Link
              href="/menu"
              className="pressable mt-6 inline-flex h-14 items-center gap-2 rounded-full bg-ink px-8 text-[16px] font-semibold text-paper"
            >
              Start your order
              <ArrowUpRightIcon size={18} weight="bold" />
            </Link>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
      <ChatLauncher />
    </div>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-paper-raised p-6">
      <div className="flex items-center gap-2.5">
        <span className="grid size-10 place-items-center rounded-full bg-coffee-tint text-coffee">
          {icon}
        </span>
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          {title}
        </h2>
      </div>
      <div className="mt-3 text-[15.5px] leading-relaxed">{children}</div>
    </div>
  );
}
