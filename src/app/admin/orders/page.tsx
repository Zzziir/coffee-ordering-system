import Link from "next/link";
import { listOrders } from "@/lib/admin-orders";
import { RANGE_KEYS, RANGE_LABEL, isRangeKey, resolveRange, summarize, type RangeKey } from "@/lib/analytics";
import { BRANCH_LIST, getBranch, isBranchId } from "@/lib/branches";
import { peso } from "@/lib/menu";
import { listEvents } from "@/lib/sales-events";
import { paginate } from "@/lib/paginate";
import { PAYMENT_LABEL, STATUS_LABEL, type PaymentMethod } from "@/lib/types";
import { FilterSelect } from "@/components/admin/filter-select";
import { hrefWith, plural, stamp } from "@/components/admin/format";
import {
  EmptyState,
  FilterPills,
  PageHeader,
  Pagination,
  SearchField,
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
// The totals in the header cover every match, not only the page on screen.
const PAGE_SIZE = 25;

const PAYMENT_METHODS = Object.keys(PAYMENT_LABEL) as PaymentMethod[];
const isPaymentMethod = (value: unknown): value is PaymentMethod =>
  PAYMENT_METHODS.includes(value as PaymentMethod);

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    event?: string;
    branch?: string;
    pay?: string;
    q?: string;
    page?: string;
  }>;
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
  const branchId = isBranchId(params.branch) ? params.branch : null;
  const payment = isPaymentMethod(params.pay) ? params.pay : null;
  const search = (params.q ?? "").trim().toLowerCase();

  const orders = fetched.filter(
    (o) =>
      (!storeOnly || !o.eventId) &&
      (!branchId || o.branchId === branchId) &&
      (!payment || o.paymentMethod === payment) &&
      (!search || `${o.code} ${o.customerName}`.toLowerCase().includes(search)),
  );
  const totals = summarize(orders.filter((o) => o.paid));

  // Filters reset to the first page, so `page` is left out of this on purpose.
  const query = {
    range: params.range,
    event: event || storeOnly ? params.event : undefined,
    branch: branchId ?? undefined,
    pay: payment ?? undefined,
    q: search ? params.q : undefined,
  };
  const filtered = Boolean(query.event || query.branch || query.pay || query.q);
  const page = paginate(orders, params.page, PAGE_SIZE);
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

      <div id="orders" className="flex scroll-mt-32 flex-wrap items-center gap-2">
        <FilterPills
          label="Period"
          options={RANGE_KEYS.map((key) => ({
            href: hrefWith(PATH, query, { range: key === DEFAULT_RANGE ? undefined : key }),
            label: RANGE_LABEL[key],
            active: key === rangeKey,
          }))}
        />
        <FilterSelect
          label="Sold at"
          name="event"
          value={query.event ?? ""}
          path={PATH}
          query={query}
          options={[
            { value: "", label: "Anywhere" },
            { value: STORE_ONLY, label: "Stores only" },
            ...events.map((e) => ({ value: e.id, label: e.name })),
          ]}
        />
        <FilterSelect
          label="Branch"
          name="branch"
          value={query.branch ?? ""}
          path={PATH}
          query={query}
          options={[
            { value: "", label: "All" },
            ...BRANCH_LIST.map((b) => ({ value: b.id, label: b.name })),
          ]}
        />
        <FilterSelect
          label="Paid by"
          name="pay"
          value={query.pay ?? ""}
          path={PATH}
          query={query}
          options={[
            { value: "", label: "Any" },
            ...PAYMENT_METHODS.map((m) => ({ value: m, label: PAYMENT_LABEL[m] })),
          ]}
        />
        <SearchField
          path={PATH}
          value={params.q ?? ""}
          label="Search orders by code or customer"
          placeholder="Search code or customer"
          keep={{ ...query, q: undefined }}
          clearHref={hrefWith(PATH, query, { q: undefined })}
        />
        {filtered && (
          <Link
            href={hrefWith(PATH, { range: params.range }, {})}
            scroll={false}
            className="pressable flex h-10 items-center px-2 text-[13.5px] font-semibold text-coffee"
          >
            Clear filters
          </Link>
        )}
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No orders in this view.">
          {filtered ? (
            <>
              Nothing matches those filters.{" "}
              <Link href={hrefWith(PATH, { range: params.range }, {})} className="font-semibold text-coffee">
                Clear filters
              </Link>
            </>
          ) : (
            <>
              Try a longer period.{" "}
              <Link href={hrefWith(PATH, query, { range: "all" })} className="font-semibold text-coffee">
                Show all time
              </Link>
            </>
          )}
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
              {page.rows.map((o) => (
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
          <Pagination
            page={page}
            noun="order"
            hrefFor={(n) => `${hrefWith(PATH, query, { page: n > 1 ? String(n) : undefined })}#orders`}
          />
        </>
      )}
    </div>
  );
}
