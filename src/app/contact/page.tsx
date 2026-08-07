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
import {
  BRANCH_LIST,
  branchFullName,
  hoursSummary,
  openStatusLabel,
  isOpen,
  type Branch,
} from "@/lib/branches";
import { CHANNEL_LABEL } from "@/lib/types";
import { clsx } from "@/lib/clsx";

export const metadata = {
  title: "Contact — Craffé",
  description:
    "Both Craffé branches — East Rembo, Makati and Craffé by MYCC in Marilao. Hours, locations, and how to reach us.",
};

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
            Three Craffés, one menu. Order ahead at whichever is closest and
            we&apos;ll have it ready when you arrive.
          </p>
        </section>

        {/* Every branch, straight from the registry — a third Craffé is a new
            record in lib/branches, not an edit here. */}
        <section className="mx-auto max-w-[1080px] px-5 py-10 lg:px-8">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {BRANCH_LIST.map((branch, i) => (
              <Reveal key={branch.id} delay={i * 0.08}>
                <BranchCard branch={branch} />
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1080px] px-5 pb-10 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <Reveal>
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

            <Reveal delay={0.1} className="flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-line bg-paper-raised">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/brand/storefront-day.jpg"
                  alt="The Craffé East Rembo storefront on 15th Ave"
                  fill
                  sizes="(max-width: 1024px) 100vw, 540px"
                  className="object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-2.5">
                  <StorefrontIcon size={22} weight="fill" className="text-coffee" />
                  <p className="text-[15px] font-medium text-ink">
                    The original, on 15th Ave
                  </p>
                </div>
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

function BranchCard({ branch }: { branch: Branch }) {
  const open = isOpen(branch);
  return (
    <div className="flex h-full flex-col rounded-[var(--radius-lg)] border border-line bg-paper-raised p-6">
      <h2 className="text-[17px] font-semibold text-ink">{branchFullName(branch)}</h2>
      <p className="mt-1 flex items-start gap-2 text-[14.5px] leading-relaxed text-ink-soft">
        <MapPinIcon size={17} weight="fill" className="mt-0.5 shrink-0 text-coffee" />
        <span>
          {branch.addressLine}
          <br />
          {branch.city}
        </span>
      </p>

      <p
        className={clsx(
          "mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium",
          open ? "text-ready" : "text-ink-faint",
        )}
      >
        <span className={clsx("size-1.5 rounded-full", open ? "bg-ready" : "bg-ink-faint")} />
        {openStatusLabel(branch)}
      </p>

      <div className="mt-3 flex items-start gap-2 text-[14px] text-ink-soft">
        <ClockIcon size={17} weight="fill" className="mt-0.5 shrink-0 text-coffee" />
        <span>
          {hoursSummary(branch).map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </span>
      </div>

      <p className="mt-3 text-[13.5px] text-ink-soft">
        {branch.channels.map((c) => CHANNEL_LABEL[c]).join(" · ")}
      </p>

      <a
        href={branch.mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="pressable mt-auto inline-flex items-center gap-1 pt-4 text-[14.5px] font-medium text-coffee"
      >
        Open in Google Maps
        <ArrowUpRightIcon size={15} weight="bold" />
      </a>
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
