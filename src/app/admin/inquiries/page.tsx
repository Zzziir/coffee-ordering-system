import {
  HandshakeIcon,
  ConfettiIcon,
  MapPinIcon,
  CalendarBlankIcon,
  UsersThreeIcon,
  ClockCountdownIcon,
  EnvelopeSimpleIcon,
  PhoneIcon,
} from "@phosphor-icons/react/dist/ssr";
import { listInquiries, type Inquiry } from "@/lib/inquiries";
import { clsx } from "@/lib/clsx";
import { StatusControl } from "./status-control";

export const dynamic = "force-dynamic";

const stamp = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const eventDateFmt = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function AdminInquiriesPage() {
  const inquiries = await listInquiries();
  const open = inquiries.filter((i) => i.status !== "closed").length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Inquiries</h1>
        <p className="mt-1 text-[14.5px] text-ink-soft">
          Franchise and event coffee cart leads from the contact page.
          {inquiries.length > 0 && (
            <>
              {" "}
              <span className="font-medium text-ink">{open}</span> still open of{" "}
              {inquiries.length}.
            </>
          )}
        </p>
      </div>

      {inquiries.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-line bg-paper-raised px-6 py-16 text-center">
          <p className="text-[15px] font-medium text-ink">No inquiries yet.</p>
          <p className="mx-auto mt-1.5 max-w-[38ch] text-[14px] text-ink-soft">
            When someone reaches out through the contact page about franchising or
            an event cart, their message lands here.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {inquiries.map((i) => (
            <InquiryCard key={i.id} inquiry={i} />
          ))}
        </ul>
      )}
    </div>
  );
}

function InquiryCard({ inquiry: i }: { inquiry: Inquiry }) {
  const franchise = i.kind === "franchise";
  const Icon = franchise ? HandshakeIcon : ConfettiIcon;

  return (
    <li
      className={clsx(
        "rounded-[var(--radius-lg)] border bg-paper-raised p-5",
        i.status === "closed" ? "border-line opacity-70" : "border-line",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-coffee-tint/70 text-coffee">
            <Icon size={18} weight="fill" />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-ink">{i.name}</p>
            <p className="text-[12.5px] font-medium uppercase tracking-wide text-ink-faint">
              {franchise ? "Franchise" : "Event cart"} · {stamp.format(i.createdAt)}
            </p>
          </div>
        </div>
        <StatusControl id={i.id} status={i.status} />
      </div>

      {/* Contact + the fields that came with this kind of lead. */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-ink-soft">
        <DetailLink icon={<EnvelopeSimpleIcon size={15} weight="fill" />} href={`mailto:${i.email}`}>
          {i.email}
        </DetailLink>
        {i.phone && (
          <DetailLink icon={<PhoneIcon size={15} weight="fill" />} href={`tel:${i.phone}`}>
            {i.phone}
          </DetailLink>
        )}
        {franchise ? (
          <>
            {i.preferredArea && (
              <Detail icon={<MapPinIcon size={15} weight="fill" />}>{i.preferredArea}</Detail>
            )}
            {i.timeline && (
              <Detail icon={<ClockCountdownIcon size={15} weight="fill" />}>{i.timeline}</Detail>
            )}
          </>
        ) : (
          <>
            {i.eventType && <Detail icon={<ConfettiIcon size={15} weight="fill" />}>{i.eventType}</Detail>}
            {i.eventDate && (
              <Detail icon={<CalendarBlankIcon size={15} weight="fill" />}>
                {eventDateFmt.format(Date.parse(`${i.eventDate}T00:00:00+08:00`))}
              </Detail>
            )}
            {i.venue && <Detail icon={<MapPinIcon size={15} weight="fill" />}>{i.venue}</Detail>}
            {i.guestCount != null && (
              <Detail icon={<UsersThreeIcon size={15} weight="fill" />}>
                {i.guestCount} guests
              </Detail>
            )}
          </>
        )}
      </div>

      {i.message && (
        <p className="mt-3 border-l-2 border-line pl-3 text-[14px] leading-relaxed text-ink">
          {i.message}
        </p>
      )}
    </li>
  );
}

function Detail({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-coffee">{icon}</span>
      {children}
    </span>
  );
}

function DetailLink({
  icon,
  href,
  children,
}: {
  icon: React.ReactNode;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className="pressable inline-flex items-center gap-1.5 hover:text-ink">
      <span className="text-coffee">{icon}</span>
      {children}
    </a>
  );
}
