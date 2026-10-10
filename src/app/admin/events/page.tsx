import Link from "next/link";
import { CalendarBlankIcon, MapPinIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { listOrders } from "@/lib/admin-orders";
import { dayKey, summarize } from "@/lib/analytics";
import { getBranch } from "@/lib/branches";
import { peso } from "@/lib/menu";
import { coversDay, listEvents, type SalesEvent } from "@/lib/sales-events";
import { dateSpan, plural } from "@/components/admin/format";
import { EmptyState, PageHeader } from "@/components/admin/report-ui";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const [events, sales] = await Promise.all([listEvents(), listOrders({ eventSalesOnly: true })]);

  const today = dayKey(Date.now());
  const live = events.filter((e) => coversDay(e, today));
  const liveIds = new Set(live.map((e) => e.id));
  const open = events.filter((e) => e.status === "active" && !liveIds.has(e.id));
  const closed = events.filter((e) => e.status === "closed");

  const totalsFor = (event: SalesEvent) =>
    summarize(sales.filter((o) => o.paid && o.eventId === event.id));

  const all = summarize(sales.filter((o) => o.paid));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Events"
        sub={
          events.length === 0
            ? "Bazaars and pop-ups, each with its own sales report and till count."
            : `${plural(events.length, "event")} so far, ${peso(all.revenue)} from ${plural(all.orders, "sale")}.`
        }
      >
        <Link
          href="/admin/events/new"
          className="pressable inline-flex h-10 items-center gap-1.5 rounded-full bg-ink pl-3.5 pr-4 text-[14px] font-semibold text-paper"
        >
          <PlusIcon size={16} weight="bold" />
          New event
        </Link>
      </PageHeader>

      {events.length === 0 && (
        <EmptyState title="No events yet.">
          Create one before your next bazaar. Every sale you ring up against it is counted
          separately from the stores, and you can balance the cash at the end of the day.
        </EmptyState>
      )}

      <EventGroup title="Happening now" events={live} totalsFor={totalsFor} live />
      <EventGroup title="Open" events={open} totalsFor={totalsFor} />
      <EventGroup title="Closed" events={closed} totalsFor={totalsFor} />
    </div>
  );
}

function EventGroup({
  title,
  events,
  totalsFor,
  live = false,
}: {
  title: string;
  events: SalesEvent[];
  totalsFor: (event: SalesEvent) => { revenue: number; orders: number };
  live?: boolean;
}) {
  if (events.length === 0) return null;

  return (
    <section>
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        {live && (
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-ready opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-ready" />
          </span>
        )}
        {title}
      </h2>
      <ul className="mt-3 grid gap-3 md:grid-cols-2">
        {events.map((event) => {
          const totals = totalsFor(event);
          const place = [event.venue, event.city].filter(Boolean).join(", ");
          return (
            <li key={event.id}>
              <Link
                href={`/admin/events/${event.id}`}
                className="menu-card flex h-full flex-col rounded-[var(--radius-md)] border border-line bg-paper-raised p-4"
              >
                <p className="text-[16px] font-semibold leading-snug text-ink">{event.name}</p>
                <p className="mt-1.5 flex items-center gap-1.5 text-[13.5px] text-ink-soft">
                  <CalendarBlankIcon size={15} className="shrink-0 text-ink-faint" />
                  {dateSpan(event.startsOn, event.endsOn)}
                </p>
                {place && (
                  <p className="mt-1 flex items-center gap-1.5 text-[13.5px] text-ink-soft">
                    <MapPinIcon size={15} className="shrink-0 text-ink-faint" />
                    <span className="truncate">{place}</span>
                  </p>
                )}
                <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                  <div>
                    <p className="text-[20px] font-bold tracking-tight text-ink">
                      {peso(totals.revenue)}
                    </p>
                    <p className="text-[12.5px] text-ink-faint">{plural(totals.orders, "sale")}</p>
                  </div>
                  <p className="text-[12.5px] text-ink-faint">Run by {getBranch(event.branchId).name}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
