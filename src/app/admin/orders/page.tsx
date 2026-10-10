import Link from "next/link";
import { listOrders } from "@/lib/admin-orders";
import { RANGE_KEYS, RANGE_LABEL, isRangeKey, resolveRange, summarize, type RangeKey } from "@/lib/analytics";
import { getBranch } from "@/lib/branches";
import { peso } from "@/lib/menu";
import { listEvents } from "@/lib/sales-events";
import { PAYMENT_LABEL, STATUS_LABEL } from "@/lib/types";
import { hrefWith, plural, stamp } from "@/components/admin/format";
import {
  EmptyState,
  FilterPills,
  PageHeader,
  TableShell,
  Th,
  tableHeadClass,
} from "@/components/admin/report-ui";
import { EventSelect } from "./event-select";

export const dynamic = "force-dynamic";

const PATH = "/admin/orders";
const DEFAULT_RANGE: RangeKey = "30d";
/** The `event` filter value for sales that belong to no event. */
const STORE_ONLY = "none";
// A screenful of rows keeps the page quick; the totals above cover every match.
const MAX_ROWS = 200;

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; event?: string }>;
}) {
  const params = await searchParams;
  const rangeKey = isRangeKey(params.range) ? params.range : DEFAULT_RANGE;
  const range = resolveRange(rangeKey, Date.now());

  const events = await listEvents();
  const event = events.find((e) => e.id === params.event);
  const storeOnly = params.event === STORE_ONLY;

  const fetched = await listOrders({
    from: range.current?.from,
    to: range.current?.to,
    eventId: event?.id,
  });
  const orders = storeOnly ? fetched.filter((o) => !o.eventId) : fetched;
  const totals = summarize(orders.filter((o) => o.paid));

  const query = { range: params.range, event: params.event };
  const eventOptions = events.map((e) => ({ id: e.id, name: e.name }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Transactions"
        sub={
          <>
            {plural(orders.length, "order")}, {peso(totals.revenue)} paid.
            {" "}Use the last column to move a sale onto a bazaar, or back to the store.
          </>
        }
      >
        <Link
          href={hrefWith("/admin/sales", { range: params.range }, {})}
          className="pressable inline-flex h-10 items-center rounded-full border border-line-strong px-4 text-[14px] font-medium text-ink"
        >
          Sales report
        </Link>
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        <FilterPills
          label="Period"
          options={RANGE_KEYS.map((key) => ({
            href: hrefWith(PATH, query, { range: key === DEFAULT_RANGE ? undefined : key }),
            label: RANGE_LABEL[key],
            active: key === rangeKey,
          }))}
        />
        <FilterPills
          label="Where it was sold"
          options={[
            { href: hrefWith(PATH, query, { event: undefined }), label: "Everything", active: !event && !storeOnly },
            { href: hrefWith(PATH, query, { event: STORE_ONLY }), label: "Stores", active: storeOnly },
            ...events.map((e) => ({
              href: hrefWith(PATH, query, { event: e.id }),
              label: e.name,
              active: e.id === event?.id,
            })),
          ]}
        />
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No orders in this view.">
          Try a longer period.{" "}
          <Link href={hrefWith(PATH, query, { range: "all" })} className="font-semibold text-coffee">
            Show all time
          </Link>
          .
        </EmptyState>
      ) : (
        <>
          <TableShell minWidth="860px">
            <thead className={tableHeadClass}>
              <tr>
                <Th>Code</Th>
                <Th>When</Th>
                <Th>Customer</Th>
                <Th>Items</Th>
                <Th>Paid by</Th>
                <Th className="text-right">Total</Th>
                <Th>Sold at</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.slice(0, MAX_ROWS).map((o) => (
                <tr key={o.id} className="bg-paper-raised align-middle">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-ink">{o.code}</span>
                    <span className="block text-[12px] text-ink-faint">{getBranch(o.branchId).name}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{stamp(o.createdAt)}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {o.customerId ? (
                      <Link href={`/admin/customers/${o.customerId}`} className="font-medium text-coffee">
                        {o.customerName}
                      </Link>
                    ) : (
                      o.customerName
                    )}
                  </td>
                  <td className="max-w-[15rem] truncate px-4 py-3 text-ink-soft">
                    {o.items.map((l) => `${l.qty}× ${l.name}`).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{PAYMENT_LABEL[o.paymentMethod]}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-ink">
                    {peso(o.subtotal)}
                    {!o.paid && <span className="ml-1 text-[11px] font-medium text-warn">unpaid</span>}
                    {o.status !== "completed" && (
                      <span className="block text-[12px] font-normal text-ink-faint">
                        {STATUS_LABEL[o.status]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <EventSelect
                      orderId={o.id}
                      orderCode={o.code}
                      eventId={o.eventId}
                      events={eventOptions}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          {orders.length > MAX_ROWS && (
            <p className="text-center text-[13.5px] text-ink-soft">
              Showing the latest {MAX_ROWS} of {orders.length.toLocaleString("en-PH")}. Narrow the
              period to see older ones.
            </p>
          )}
        </>
      )}
    </div>
  );
}
