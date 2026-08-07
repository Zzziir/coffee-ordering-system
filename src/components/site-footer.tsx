import Link from "next/link";
import {
  FacebookLogoIcon,
  InstagramLogoIcon,
  MapPinIcon,
  ClockIcon,
  ArrowUpRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Wordmark, CupMark } from "./brand";
import { BRANCH_LIST, branchAddress, branchFullName } from "@/lib/branches";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-paper">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-5 py-16 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr] lg:px-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-paper text-ink">
              <CupMark className="size-5" />
            </span>
            <Wordmark className="text-lg text-paper" />
          </div>
          <p className="mt-4 max-w-[32ch] text-[14.5px] leading-relaxed text-paper/60">
            Sending you a whole latte love. Order ahead, made fresh, ready the
            moment you arrive.
          </p>
          <div className="mt-5 flex gap-2.5">
            <a
              href="https://www.facebook.com/"
              aria-label="Craffé on Facebook"
              className="pressable grid size-10 place-items-center rounded-full bg-paper/10 text-paper hover:bg-paper/20"
            >
              <FacebookLogoIcon size={20} weight="fill" />
            </a>
            <a
              href="https://www.instagram.com/"
              aria-label="Craffé on Instagram"
              className="pressable grid size-10 place-items-center rounded-full bg-paper/10 text-paper hover:bg-paper/20"
            >
              <InstagramLogoIcon size={20} weight="fill" />
            </a>
          </div>
        </div>

        {/* Explore */}
        <FooterCol title="Explore">
          <FooterLink href="/menu">Menu</FooterLink>
          <FooterLink href="/story">Our Story</FooterLink>
          <FooterLink href="/gallery">Gallery</FooterLink>
          <FooterLink href="/contact">Contact</FooterLink>
        </FooterCol>

        {/* Order */}
        <FooterCol title="Order">
          <FooterLink href="/menu">Order ahead</FooterLink>
          <FooterLink href="/qr">Table tents</FooterLink>
          <FooterLink href="/cart">Your bag</FooterLink>
        </FooterCol>

        {/* Visit */}
        <div>
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-paper/50">
            Visit
          </h3>
          <div className="mt-4 flex flex-col gap-3 text-[14.5px] text-paper/80">
            {BRANCH_LIST.map((branch) => (
              <p key={branch.id} className="flex items-start gap-2.5">
                <MapPinIcon size={18} weight="fill" className="mt-0.5 shrink-0 text-coffee" />
                <span>
                  {branchFullName(branch)}
                  <br />
                  <span className="text-paper/60">{branchAddress(branch)}</span>
                </span>
              </p>
            ))}
            <Link
              href="/contact"
              className="pressable inline-flex items-center gap-1.5 text-[14px] font-medium text-paper/80 hover:text-paper"
            >
              <ClockIcon size={16} weight="fill" className="shrink-0 text-coffee" />
              Hours &amp; directions
              <ArrowUpRightIcon size={13} weight="bold" />
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-2 px-5 py-6 text-[13px] text-paper/50 sm:flex-row lg:px-8">
          <p>© 2026 Craffé Coffee. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with a whole latte love
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-paper/50">
        {title}
      </h3>
      <ul className="mt-4 flex flex-col gap-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="group inline-flex items-center gap-1 text-[14.5px] text-paper/80 transition-colors hover:text-paper"
      >
        {children}
        <ArrowUpRightIcon
          size={14}
          weight="bold"
          className="opacity-0 transition-opacity group-hover:opacity-100"
        />
      </Link>
    </li>
  );
}
