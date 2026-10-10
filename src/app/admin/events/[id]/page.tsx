import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BasketIcon,
  CalendarBlankIcon,
  CaretLeftIcon,
  MapPinIcon,
  PlusIcon,
  ReceiptIcon,
  TagIcon,
  TrendUpIcon,
  UserIcon,
} from "@phosphor-icons/react/dist/ssr";
import { listOrders } from "@/lib/admin-orders";
import {
  breakdown,
  categorySales,
  cumulative,
  dayKey,
  hourlyTrend,
  itemSales,
  summarize,
  trend,
} from "@/lib/analytics";
import { getBranch } from "@/lib/branches";
import { getMenu } from "@/lib/menu-store";
import { peso } from "@/lib/menu";
import { coversDay, getEvent, reconcileCash } from "@/lib/sales-events";
import { PAYMENT_LABEL, type PaymentMethod } from "@/lib/types";
import { CumulativeChart, RankBars, type ChartPoint } from "@/components/admin/charts";
import { dateSpan, percent, plural, shortDay, stamp, weekdayHour } from "@/components/admin/format";
import {
  EmptyState,
  Panel,
  StatTile,
  TableShell,
  Th,
  tableHeadClass,
} from "@/components/admin/report-ui";
import { clsx } from "@/lib/clsx";
import { reopenEventAction } from "../actions";
import { CloseForm } from "../close-form";
import { EventForm } from "../event-form";

export const dynamic = "force-dynamic";

const RECENT_SALES = 12;

export default async function AdminEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const [orders, menu] = await Promise.all([listOrders({ eventId: event.id }), getMenu()]);
  const paid = orders.filter((o) => o.paid);

  const now = Date.now();
  const totals = summarize(paid);
  const live = coversDay(event, dayKey(now));
  const closed = event.status === "closed";
  const place = [event.venue, event.city].filter(Boolean).join(", ");

  const byPayment = breakdown(
    paid,
    (o) => o.paymentMethod,
    (key) => PAYMENT_LABEL[key as PaymentMethod],
  );
  const cashSales = byPayment.find((s) => s.key === "cash")?.revenue ?? 0;
  const cash = reconcileCash(event, cashSales);

  // A day or two reads best hour by hour; a longer run, day by day.
  const hours = hourlyTrend(paid);
  const buildUp: ChartPoint[] = hours
    ? cumulative(hours).map((point) => ({
        label: weekdayHour(point.at),
        value: point.revenue,
        title: weekdayHour(point.at),
        detail: [`${peso(point.revenue)} so far`, plural(point.orders, "sale")],
      }))
    : cumulative(trend(paid, null, now).points).map((point) => ({
        label: shortDay(point.day),
        value: point.revenue,
        title: shortDay(point.day),
        detail: [`${peso(point.revenue)} so far`, plural(point.orders, "sale")],
      }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/events"
          className="pressable -ml-1 inline-flex h-9 items-center gap-1 text-[14px] font-medium text-ink-soft hover:text-ink"
        >
          <CaretLeftIcon size={16} weight="bold" />
          Events
        </Link>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-ink">{event.name}</h1>
              <span
                className={clsx(
                  "rounded-full px-2.5 py-1 text-[12px] font-semibold",
                  live
                    ? "bg-ready-tint text-ready"
                    : closed
                      ? "bg-paper-sunk text-ink-soft"
                      : "bg-coffee-tint text-coffee-deep",
                )}
              >
                {live ? "Happening now" : closed ? "Closed" : "Open"}
              </span>
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-ink-soft">
              <li className="flex items-center gap-1.5">
                <CalendarBlankIcon size={16} className="text-ink-faint" />
                {dateSpan(event.startsOn, event.endsOn)}
              </li>
              {place && (
                <li className="flex items-center gap-1.5">
                  <MapPinIcon size={16} className="text-ink-faint" />
                  {place}
                </li>
              )}
              {event.organizer && (
                <li className="flex items-center gap-1.5">
                  <UserIcon size={16} className="text-ink-faint" />
                  {event.organizer}
                </li>
              )}
              <li>Run by {getBranch(event.branchId).name}</li>
            </ul>
          </div>

          {!closed && (
            <Link
              href={`/admin/orders/new?event=${event.id}`}
              className="pressable inline-flex h-10 items-center gap-1.5 rounded-full bg-ink pl-3.5 pr-4 text-[14px] font-semibold text-paper"
            >
              <PlusIcon size={16} weight="bold" />
              Ring up a sale
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={<TrendUpIcon size={20} weight="fill" />}
          label="Revenue"
          value={peso(totals.revenue)}
          sub="paid sales"
        />
        <StatTile
          icon={<ReceiptIcon size={20} weight="fill" />}
          label="Sales"
          value={totals.orders.toLocaleString("en-PH")}
          sub="transactions"
        />
        <StatTile
          icon={<TagIcon size={20} weight="fill" />}
          label="Average sale"
          value={peso(totals.aov)}
          sub="per transaction"
        />
        <StatTile
          icon={<BasketIcon size={20} weight="fill" />}
          label="Items sold"
          value={totals.items.toLocaleString("en-PH")}
          sub={`${totals.itemsPerOrder.toFixed(1)} per sale`}
        />
      </div>

      {paid.length === 0 ? (
        <EmptyState title="No sales against this event yet.">
          Ring up a sale from the booth, or move an existing sale here from the transactions page.
        </EmptyState>
      ) : (
        <>
          <Panel title="How the takings built up" hint="Running total of revenue">
            <CumulativeChart label="Running total of revenue" format={peso} points={buildUp} />
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Top sellers" hint="By units sold">
              <RankBars
                rows={itemSales(paid)
                  .slice(0, 8)
                  .map((item) => ({
                    key: item.itemId,
                    label: item.name,
                    value: item.qty,
                    display: `${item.qty} sold`,
                    note: peso(item.revenue),
                  }))}
                empty="No sales yet."
              />
            </Panel>
            <Panel title="What sold" hint="Share of item revenue by category">
              <RankBars
                rows={categorySales(paid, menu).map((c) => ({
                  key: c.id,
                  label: c.name,
                  value: c.revenue,
                  display: peso(c.revenue),
                  note: `${percent(c.share)} · ${c.qty} sold`,
                }))}
                empty="No sales yet."
              />
            </Panel>
          </div>
        </>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="How customers paid">
          <RankBars
            rows={byPayment.map((s) => ({
              key: s.key,
              label: s.label,
              value: s.revenue,
              display: peso(s.revenue),
              note: `${percent(s.share)} · ${plural(s.orders, "sale")}`,
            }))}
            empty="No sales yet."
          />
        </Panel>

        <Panel
          title="Cash in the till"
          hint="Opening cash plus cash sales, against what was counted"
        >
          <dl className="flex flex-col gap-2 text-[14px]">
            <CashRow label="Opening cash" value={peso(cash.opening)} />
            <CashRow label="Cash sales" value={peso(cash.cashSales)} />
            <CashRow label="Expected in the till" value={peso(cash.expected)} strong />
            {cash.counted !== null && cash.variance !== null && (
              <>
                <CashRow label="Counted" value={peso(cash.counted)} />
                <div className="mt-1 flex items-center justify-between rounded-[var(--radius-sm)] bg-paper-sunk px-3.5 py-3">
                  <dt className="font-medium text-ink">
                    {cash.variance === 0 ? "Balanced" : cash.variance > 0 ? "Over" : "Short"}
                  </dt>
                  <dd
                    className={clsx(
                      "text-[16px] font-bold tabular-nums",
                      cash.variance === 0 ? "text-ready" : "text-warn",
                    )}
                  >
                    {cash.variance === 0 ? peso(0) : peso(Math.abs(cash.variance))}
                  </dd>
                </div>
              </>
            )}
          </dl>
          {event.cashNote && (
            <p className="mt-3 text-[13px] text-ink-soft">Note: {event.cashNote}</p>
          )}

          <div className="mt-5 border-t border-line pt-4">
            {closed ? (
              <form action={reopenEventAction} className="flex flex-wrap items-center justify-between gap-3">
                <input type="hidden" name="id" value={event.id} />
                <p className="text-[13.5px] text-ink-soft">
                  Closed{event.closedAt ? ` ${stamp(event.closedAt)}` : ""}. New sales can&apos;t be
                  rung up against it.
                </p>
                <button
                  type="submit"
                  className="pressable h-10 rounded-full border border-line-strong px-4 text-[14px] font-medium text-ink"
                >
                  Reopen
                </button>
              </form>
            ) : (
              <CloseForm eventId={event.id} expected={cash.expected} />
            )}
          </div>
        </Panel>
      </div>

      {orders.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-ink">Latest sales</h2>
            <Link
              href={`/admin/orders?event=${event.id}`}
              className="text-[14px] font-semibold text-coffee"
            >
              All {orders.length.toLocaleString("en-PH")}
            </Link>
          </div>
          <TableShell minWidth="520px">
            <thead className={tableHeadClass}>
              <tr>
                <Th>Code</Th>
                <Th>When</Th>
                <Th>Items</Th>
                <Th>Paid by</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.slice(0, RECENT_SALES).map((o) => (
                <tr key={o.id} className="bg-paper-raised">
                  <td className="px-4 py-3 font-semibold text-ink">{o.code}</td>
                  <td className="px-4 py-3 text-ink-soft">{stamp(o.createdAt)}</td>
                  <td className="max-w-[16rem] truncate px-4 py-3 text-ink-soft">
                    {o.items.map((l) => `${l.qty}× ${l.name}`).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{PAYMENT_LABEL[o.paymentMethod]}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">
                    {peso(o.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </section>
      )}

      <details className="group rounded-[var(--radius-md)] border border-line bg-paper-raised">
        <summary className="flex h-12 cursor-pointer list-none items-center px-4 text-[15px] font-semibold text-ink sm:px-5 [&::-webkit-details-marker]:hidden">
          Edit event details
        </summary>
        <div className="border-t border-line p-4 sm:p-5">
          <EventForm event={event} />
        </div>
      </details>
    </div>
  );
}

function CashRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={strong ? "font-medium text-ink" : "text-ink-soft"}>{label}</dt>
      <dd className={clsx("tabular-nums text-ink", strong && "font-semibold")}>{value}</dd>
    </div>
  );
}
