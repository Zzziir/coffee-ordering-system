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
} from "@phosphor-icons/react/dist/ssr";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { ChatLauncher } from "@/components/chat/chat-launcher";
import { BentoGrid, BentoCard } from "@/components/bento";
import { Marquee } from "@/components/marquee";
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
import { clsx } from "@/lib/clsx";

export const metadata = {
  title: "Contact · Craffé",
  description:
    "Both Craffé branches: East Rembo, Makati and Craffé by MYCC in Marilao. Hours, locations, and how to reach us.",
};

export default function ContactPage() {
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
                      {signatureItems().map((item) => (
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
