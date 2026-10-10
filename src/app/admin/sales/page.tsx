import Link from "next/link";
import {
  ArrowRightIcon,
  BasketIcon,
  ReceiptIcon,
  TagIcon,
  TrendUpIcon,
} from "@phosphor-icons/react/dist/ssr";
import { listOrders, type AdminOrder } from "@/lib/admin-orders";
import {
  RANGE_KEYS,
  RANGE_LABEL,
  WEEKDAYS,
  addOnReport,
  breakdown,
  categorySales,
  change,
  isRangeKey,
  itemSales,
  resolveRange,
  rushGrid,
  summarize,
  trend,
  within,
  type RangeKey,
} from "@/lib/analytics";
import { BRANCH_LIST, getBranch, isBranchId } from "@/lib/branches";
import { getMenu } from "@/lib/menu-store";
import { peso } from "@/lib/menu";
import { CHANNEL_LABEL, PAYMENT_LABEL, type OrderChannel, type PaymentMethod } from "@/lib/types";
import { ColumnChart, RankBars, RushHeatmap, type RankRow } from "@/components/admin/charts";
import { hrefWith, percent, plural, shortDay } from "@/components/admin/format";
import { EmptyState, FilterPills, PageHeader, Panel, StatTile } from "@/components/admin/report-ui";

export const dynamic = "force-dynamic";

const PATH = "/admin/sales";
const DEFAULT_RANGE: RangeKey = "30d";

/** Where a sale was made: one of the stores, or a bazaar booth. */
const SOURCES = ["all", "stores", "events"] as const;
type Source = (typeof SOURCES)[number];
const SOURCE_LABEL: Record<Source, string> = {
  all: "Everything",
  stores: "Stores",
  events: "Bazaars",
};
const EVENTS_KEY = "events";

const TOP_ROWS = 8;

const sliceRows = (slices: { key: string; label: string; revenue: number; orders: number; share: number }[]): RankRow[] =>
  slices.map((s) => ({
    key: s.key,
    label: s.label,
    value: s.revenue,
    display: peso(s.revenue),
    note: `${percent(s.share)} · ${plural(s.orders, "order")}`,
  }));

export default async function AdminSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; source?: string; branch?: string }>;
}) {
  const params = await searchParams;
  const rangeKey = isRangeKey(params.range) ? params.range : DEFAULT_RANGE;
  const source: Source = SOURCES.includes(params.source as Source) ? (params.source as Source) : "all";
  const branchId = isBranchId(params.branch) ? params.branch : null;

  const now = Date.now();
  const range = resolveRange(rangeKey, now);

  // One read covers this period and the one before it, for the comparisons.
  const [orders, menu] = await Promise.all([
    listOrders({ from: range.previous?.from }),
    getMenu(),
  ]);

  const matches = (o: AdminOrder) =>
    o.paid &&
    (source === "all" || (source === "events") === Boolean(o.eventId)) &&
    (!branchId || o.branchId === branchId);

  const scoped = orders.filter(matches);
  const current = scoped.filter((o) => within(o, range.current));
  const previous = range.previous ? scoped.filter((o) => within(o, range.previous)) : null;

  const totals = summarize(current);
  const before = previous ? summarize(previous) : null;
  const series = trend(current, range.current, now);
  const addOns = addOnReport(current);

  // A booth sale belongs to the bazaar, not to the store that staffed it.
  const bySource = breakdown(
    current,
    (o) => (o.eventId ? EVENTS_KEY : o.branchId),
    (key) => (isBranchId(key) ? getBranch(key).name : "Bazaars and events"),
  );
  const byPayment = breakdown(
    current,
    (o) => o.paymentMethod,
    (key) => PAYMENT_LABEL[key as PaymentMethod],
  );
  const byChannel = breakdown(
    current,
    (o) => (o.eventId ? EVENTS_KEY : o.channel),
    (key) => (key === EVENTS_KEY ? "At a bazaar" : CHANNEL_LABEL[key as OrderChannel]),
  );
  const items = itemSales(current);
  const categories = categorySales(current, menu);

  const query = { range: params.range, source: params.source, branch: params.branch };
  const versus = `vs previous ${RANGE_LABEL[rangeKey]}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sales"
        sub="Paid orders across the stores and every bazaar. Times are Manila time."
      >
        <Link
          href={hrefWith("/admin/orders", { range: params.range }, {})}
          className="pressable inline-flex h-10 items-center gap-1.5 rounded-full border border-line-strong px-4 text-[14px] font-medium text-ink"
        >
          Transactions
          <ArrowRightIcon size={15} weight="bold" />
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
          options={SOURCES.map((key) => ({
            href: hrefWith(PATH, query, { source: key === "all" ? undefined : key }),
            label: SOURCE_LABEL[key],
            active: key === source,
          }))}
        />
        <FilterPills
          label="Branch"
          options={[
            { href: hrefWith(PATH, query, { branch: undefined }), label: "All branches", active: !branchId },
            ...BRANCH_LIST.map((b) => ({
              href: hrefWith(PATH, query, { branch: b.id }),
              label: b.name,
              active: b.id === branchId,
            })),
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={<TrendUpIcon size={20} weight="fill" />}
          label="Revenue"
          value={peso(totals.revenue)}
          delta={change(totals.revenue, before?.revenue)}
          versus={versus}
          sub={RANGE_LABEL[rangeKey]}
        />
        <StatTile
          icon={<ReceiptIcon size={20} weight="fill" />}
          label="Orders"
          value={totals.orders.toLocaleString("en-PH")}
          delta={change(totals.orders, before?.orders)}
          versus={versus}
          sub={RANGE_LABEL[rangeKey]}
        />
        <StatTile
          icon={<TagIcon size={20} weight="fill" />}
          label="Average order"
          value={peso(totals.aov)}
          delta={change(totals.aov, before?.aov)}
          versus={versus}
          sub="per paid order"
        />
        <StatTile
          icon={<BasketIcon size={20} weight="fill" />}
          label="Items per order"
          value={totals.itemsPerOrder.toFixed(1)}
          sub={`${plural(totals.items, "item")} sold`}
        />
      </div>

      {current.length === 0 ? (
        <EmptyState title="No paid orders in this view.">
          Try a longer period or a different filter.{" "}
          <Link href={hrefWith(PATH, query, { range: "all" })} className="font-semibold text-coffee">
            Show all time
          </Link>
          .
        </EmptyState>
      ) : (
        <>
          <Panel
            title="Revenue over time"
            hint={series.bucket === "week" ? "Each bar is one week" : "Each bar is one day"}
          >
            <ColumnChart
              label="Revenue over time"
              format={peso}
              points={series.points.map((point) => ({
                label: shortDay(point.day),
                value: point.revenue,
                title: series.bucket === "week" ? `Week of ${shortDay(point.day)}` : shortDay(point.day),
                detail: [peso(point.revenue), plural(point.orders, "order")],
              }))}
            />
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Where sales came from" hint="Bazaar sales are counted apart from the stores">
              <RankBars rows={sliceRows(bySource)} empty="No sales yet." />
            </Panel>
            <Panel title="How customers paid">
              <RankBars rows={sliceRows(byPayment)} empty="No sales yet." />
            </Panel>
            <Panel title="Top sellers" hint="By units sold">
              <RankBars
                rows={items.slice(0, TOP_ROWS).map((item) => ({
                  key: item.itemId,
                  label: item.name,
                  value: item.qty,
                  display: `${item.qty} sold`,
                  note: peso(item.revenue),
                }))}
                empty="No sales yet."
              />
            </Panel>
            <Panel title="Menu categories" hint="Share of item revenue">
              <RankBars
                rows={categories.slice(0, TOP_ROWS).map((c) => ({
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

          <Panel title="When the rush hits" hint="Orders by weekday and hour">
            <RushHeatmap grid={rushGrid(current)} rowLabels={WEEKDAYS} />
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="How orders were taken">
              <RankBars rows={sliceRows(byChannel)} empty="No sales yet." />
            </Panel>
            <Panel
              title="Add-ons and rewards"
              hint={`${percent(addOns.attachRate)} of items sold carried a paid add-on`}
            >
              <dl className="mb-5 grid grid-cols-2 gap-3">
                <div className="rounded-[var(--radius-sm)] bg-paper-sunk px-3.5 py-3">
                  <dt className="text-[12.5px] text-ink-soft">Earned from add-ons</dt>
                  <dd className="mt-0.5 text-[17px] font-bold text-ink">{peso(addOns.revenue)}</dd>
                </div>
                <div className="rounded-[var(--radius-sm)] bg-paper-sunk px-3.5 py-3">
                  <dt className="text-[12.5px] text-ink-soft">Given away as rewards</dt>
                  <dd className="mt-0.5 text-[17px] font-bold text-ink">{peso(totals.comped)}</dd>
                </div>
              </dl>
              <RankBars
                rows={addOns.top.slice(0, 5).map((a) => ({
                  key: a.name,
                  label: a.name,
                  value: a.revenue,
                  display: peso(a.revenue),
                  note: `${a.qty} added`,
                }))}
                empty="No paid add-ons in this view."
              />
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
