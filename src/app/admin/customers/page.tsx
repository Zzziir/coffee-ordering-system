import Link from "next/link";
import {
  ArrowsClockwiseIcon,
  CrownSimpleIcon,
  UsersThreeIcon,
  WalletIcon,
} from "@phosphor-icons/react/dist/ssr";
import { listOrders } from "@/lib/admin-orders";
import {
  SEGMENTS,
  SEGMENT_HINT,
  SEGMENT_LABEL,
  buildCustomers,
  crmSummary,
  isSegment,
  listProfiles,
} from "@/lib/crm";
import { getBranch } from "@/lib/branches";
import { peso } from "@/lib/menu";
import { paginate } from "@/lib/paginate";
import { RankBars } from "@/components/admin/charts";
import { FilterSelect } from "@/components/admin/filter-select";
import { ago, hrefWith, percent } from "@/components/admin/format";
import {
  EmptyState,
  FilterPills,
  PageHeader,
  Pagination,
  Panel,
  SearchField,
  StatTile,
  TableShell,
  Th,
  tableHeadClass,
} from "@/components/admin/report-ui";
import { SegmentBadge } from "./segment-badge";

export const dynamic = "force-dynamic";

const PATH = "/admin/customers";
const PAGE_SIZE = 20;

type Customer = ReturnType<typeof buildCustomers>[number];

/** Ways to order the list. The first is the default and stays out of the URL. */
const SORTS: { value: string; label: string; compare: (a: Customer, b: Customer) => number }[] = [
  { value: "", label: "Biggest spenders", compare: (a, b) => b.spend - a.spend },
  { value: "orders", label: "Most orders", compare: (a, b) => b.orders - a.orders },
  { value: "recent", label: "Latest order", compare: (a, b) => (b.lastOrderAt ?? 0) - (a.lastOrderAt ?? 0) },
  { value: "name", label: "Name", compare: (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`) },
];

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ segment?: string; q?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const segment = isSegment(params.segment) ? params.segment : null;
  const search = (params.q ?? "").trim().toLowerCase();

  const now = Date.now();
  const [profiles, orders] = await Promise.all([listProfiles(), listOrders()]);
  const paid = orders.filter((o) => o.paid);

  const customers = buildCustomers(profiles, paid, now);
  const summary = crmSummary(customers, paid);

  const counts = new Map(SEGMENTS.map((s) => [s, customers.filter((c) => c.segment === s).length]));
  const shown = customers.filter(
    (c) =>
      (!segment || c.segment === segment) &&
      (!search ||
        `${c.firstName} ${c.lastName} ${c.email} ${c.phone ?? ""}`.toLowerCase().includes(search)),
  );

  const sort = SORTS.find((s) => s.value === params.sort) ?? SORTS[0];
  // Filters and sorting reset to the first page, so `page` stays out of this.
  const query = { segment: segment ?? undefined, q: search ? params.q : undefined, sort: sort.value || undefined };
  const page = paginate([...shown].sort(sort.compare), params.page, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Customers"
        sub="Everyone with a Craffé account and how they buy. Guests and walk-ins are counted in the totals but can't be listed one by one."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={<UsersThreeIcon size={20} weight="fill" />}
          label="Customers"
          value={summary.customers.toLocaleString("en-PH")}
          sub={`${summary.buyers.toLocaleString("en-PH")} have ordered`}
        />
        <StatTile
          icon={<ArrowsClockwiseIcon size={20} weight="fill" />}
          label="Come back rate"
          value={percent(summary.repeatRate)}
          sub="ordered more than once"
        />
        <StatTile
          icon={<WalletIcon size={20} weight="fill" />}
          label="Lifetime spend"
          value={peso(summary.lifetimeValue)}
          sub="average per customer"
        />
        <StatTile
          icon={<CrownSimpleIcon size={20} weight="fill" />}
          label="From members"
          value={percent(summary.memberRevenueShare)}
          sub="of all revenue"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Where customers stand" hint="Based on how often and how recently they ordered">
          <RankBars
            rows={SEGMENTS.map((s) => ({
              key: s,
              label: SEGMENT_LABEL[s],
              value: counts.get(s) ?? 0,
              display: String(counts.get(s) ?? 0),
              detail: SEGMENT_HINT[s],
            }))}
            empty="No customers yet."
          />
        </Panel>
        <Panel title="Members and guests" hint="Average paid order">
          <RankBars
            rows={[
              {
                key: "member",
                label: "Signed-in customers",
                value: summary.memberAov,
                display: peso(summary.memberAov),
              },
              {
                key: "guest",
                label: "Guests and walk-ins",
                value: summary.guestAov,
                display: peso(summary.guestAov),
              },
            ]}
            empty="No sales yet."
          />
          <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">
            Members brought in {percent(summary.memberRevenueShare)} of revenue. A bigger gap between
            the two bars means an account is worth pushing at the counter.
          </p>
        </Panel>
      </div>

      <section id="list" className="flex scroll-mt-32 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <FilterPills
            label="Segment"
            options={[
              { href: hrefWith(PATH, query, { segment: undefined }), label: `All ${customers.length}`, active: !segment },
              ...SEGMENTS.map((s) => ({
                href: hrefWith(PATH, query, { segment: s }),
                label: `${SEGMENT_LABEL[s]} ${counts.get(s) ?? 0}`,
                active: s === segment,
              })),
            ]}
          />
          <FilterSelect
            label="Sort by"
            name="sort"
            value={sort.value}
            path={PATH}
            query={query}
            options={SORTS.map(({ value, label }) => ({ value, label }))}
          />
          <SearchField
            path={PATH}
            value={params.q ?? ""}
            label="Search customers"
            placeholder="Search name, email, phone"
            keep={{ ...query, q: undefined }}
            clearHref={hrefWith(PATH, query, { q: undefined })}
          />
        </div>

        {shown.length === 0 ? (
          <EmptyState title={customers.length === 0 ? "No customers yet." : "No customers match."}>
            {customers.length === 0
              ? "When someone creates an account, they show up here with their orders and spend."
              : (
                <>
                  Try a different segment or{" "}
                  <Link href={PATH} className="font-semibold text-coffee">
                    clear the filters
                  </Link>
                  .
                </>
              )}
          </EmptyState>
        ) : (
          <TableShell minWidth="820px">
            <thead className={tableHeadClass}>
              <tr>
                <Th>Customer</Th>
                <Th>Standing</Th>
                <Th className="text-right">Orders</Th>
                <Th className="text-right">Spend</Th>
                <Th className="text-right">Avg order</Th>
                <Th>Last order</Th>
                <Th>Usually orders</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {page.rows.map((c) => (
                <tr key={c.id} className="bg-paper-raised">
                  <td className="px-4 py-3">
                    <Link href={`${PATH}/${c.id}`} className="font-semibold text-ink hover:text-coffee">
                      {c.firstName} {c.lastName}
                    </Link>
                    <span className="block text-[12.5px] text-ink-faint">{c.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <SegmentBadge segment={c.segment} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink">{c.orders}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">
                    {peso(c.spend)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-soft">
                    {c.orders ? peso(c.aov) : ""}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                    {c.lastOrderAt ? ago(c.lastOrderAt, now) : "Never"}
                  </td>
                  <td className="max-w-[14rem] px-4 py-3 text-ink-soft">
                    <span className="block truncate">{c.favoriteItem ?? ""}</span>
                    {c.homeBranch && (
                      <span className="block text-[12.5px] text-ink-faint">
                        at {getBranch(c.homeBranch).name}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
        <Pagination
          page={page}
          noun="customer"
          hrefFor={(n) => `${hrefWith(PATH, query, { page: n > 1 ? String(n) : undefined })}#list`}
        />
      </section>
    </div>
  );
}
