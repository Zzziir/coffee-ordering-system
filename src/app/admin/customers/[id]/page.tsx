import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CaretLeftIcon,
  ClockCounterClockwiseIcon,
  EnvelopeSimpleIcon,
  PhoneIcon,
  ReceiptIcon,
  TagIcon,
  WalletIcon,
} from "@phosphor-icons/react/dist/ssr";
import { listOrders } from "@/lib/admin-orders";
import { breakdown, itemSales } from "@/lib/analytics";
import { getBranch, isBranchId } from "@/lib/branches";
import { customerStats, getProfile } from "@/lib/crm";
import { getLoyalty } from "@/lib/loyalty";
import { paginate } from "@/lib/paginate";
import { STAMPS_PER_REWARD, peso } from "@/lib/menu";
import { listEvents } from "@/lib/sales-events";
import { PAYMENT_LABEL, STATUS_LABEL } from "@/lib/types";
import { RankBars } from "@/components/admin/charts";
import { ago, fullDay, percent, plural, stamp } from "@/components/admin/format";
import {
  EmptyState,
  Pagination,
  Panel,
  StatTile,
  TableShell,
  Th,
  tableHeadClass,
} from "@/components/admin/report-ui";
import { SegmentBadge } from "../segment-badge";

export const dynamic = "force-dynamic";

const EVENTS_KEY = "events";

const HISTORY_PAGE_SIZE = 10;

export default async function AdminCustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: requestedPage } = await searchParams;
  const profile = await getProfile(id);
  if (!profile) notFound();

  const [orders, loyalty, events] = await Promise.all([
    listOrders({ customerId: profile.id }),
    getLoyalty(profile.id),
    listEvents(),
  ]);

  const now = Date.now();
  const paid = orders.filter((o) => o.paid);
  const stats = customerStats(paid, now);
  const eventName = new Map(events.map((e) => [e.id, e.name]));
  const history = paginate(orders, requestedPage, HISTORY_PAGE_SIZE);

  const places = breakdown(
    paid,
    (o) => (o.eventId ? EVENTS_KEY : o.branchId),
    (key) => (isBranchId(key) ? getBranch(key).name : "Bazaars and events"),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/customers"
          className="pressable -ml-1 inline-flex h-9 items-center gap-1 text-[14px] font-medium text-ink-soft hover:text-ink"
        >
          <CaretLeftIcon size={16} weight="bold" />
          Customers
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {profile.firstName} {profile.lastName}
          </h1>
          <SegmentBadge segment={stats.segment} />
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-ink-soft">
          <li>
            <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-1.5 hover:text-ink">
              <EnvelopeSimpleIcon size={16} className="text-ink-faint" />
              {profile.email}
            </a>
          </li>
          {profile.phone && (
            <li>
              <a href={`tel:${profile.phone}`} className="inline-flex items-center gap-1.5 hover:text-ink">
                <PhoneIcon size={16} className="text-ink-faint" />
                {profile.phone}
              </a>
            </li>
          )}
          <li>Joined {fullDay(profile.joinedAt)}</li>
          {profile.favoriteFlavor && <li>Likes {profile.favoriteFlavor}</li>}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={<WalletIcon size={20} weight="fill" />}
          label="Lifetime spend"
          value={peso(stats.spend)}
          sub="paid orders"
        />
        <StatTile
          icon={<ReceiptIcon size={20} weight="fill" />}
          label="Orders"
          value={String(stats.orders)}
          sub={stats.firstOrderAt ? `since ${fullDay(stats.firstOrderAt)}` : "none yet"}
        />
        <StatTile
          icon={<TagIcon size={20} weight="fill" />}
          label="Average order"
          value={peso(stats.aov)}
          sub="per paid order"
        />
        <StatTile
          icon={<ClockCounterClockwiseIcon size={20} weight="fill" />}
          label="Last order"
          value={stats.lastOrderAt ? ago(stats.lastOrderAt, now) : "Never"}
          sub={stats.lastOrderAt ? fullDay(stats.lastOrderAt) : "no orders yet"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Rewards card" hint={`${STAMPS_PER_REWARD} stamps earn a free drink`}>
          <p className="text-[22px] font-bold tracking-tight text-ink">
            {loyalty.progress} of {STAMPS_PER_REWARD}
          </p>
          <div
            className="mt-2 h-2 rounded-full bg-paper-sunk"
            role="progressbar"
            aria-label="Stamps on the current card"
            aria-valuemin={0}
            aria-valuemax={STAMPS_PER_REWARD}
            aria-valuenow={loyalty.progress}
          >
            <div
              className="h-full rounded-full bg-coffee"
              style={{ width: percent(loyalty.progress / STAMPS_PER_REWARD) }}
            />
          </div>
          <dl className="mt-4 flex flex-col gap-1.5 text-[14px]">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Free drinks to claim</dt>
              <dd className="font-semibold tabular-nums text-ink">{loyalty.free}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Rewards earned so far</dt>
              <dd className="tabular-nums text-ink">{loyalty.earnedRewards}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Stamps collected</dt>
              <dd className="tabular-nums text-ink">{loyalty.stamps}</dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Favourites" hint="By units bought">
          <RankBars
            rows={itemSales(paid)
              .slice(0, 5)
              .map((item) => ({
                key: item.itemId,
                label: item.name,
                value: item.qty,
                display: `${item.qty}`,
              }))}
            empty="Nothing ordered yet."
          />
        </Panel>

        <Panel title="Where they order">
          <RankBars
            rows={places.map((s) => ({
              key: s.key,
              label: s.label,
              value: s.orders,
              display: plural(s.orders, "order"),
              note: peso(s.revenue),
            }))}
            empty="Nothing ordered yet."
          />
        </Panel>
      </div>

      <section id="history" className="scroll-mt-32">
        <h2 className="mb-3 text-[15px] font-semibold text-ink">Order history</h2>
        {orders.length === 0 ? (
          <EmptyState title="No orders yet.">
            This customer has an account but hasn&apos;t placed an order while signed in.
          </EmptyState>
        ) : (
          <TableShell minWidth="680px">
            <thead className={tableHeadClass}>
              <tr>
                <Th>Code</Th>
                <Th>When</Th>
                <Th>Items</Th>
                <Th>Where</Th>
                <Th>Paid by</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {history.rows.map((o) => (
                <tr key={o.id} className="bg-paper-raised">
                  <td className="px-4 py-3 font-semibold text-ink">{o.code}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{stamp(o.createdAt)}</td>
                  <td className="max-w-[16rem] truncate px-4 py-3 text-ink-soft">
                    {o.items.map((l) => `${l.qty}× ${l.name}`).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {(o.eventId && eventName.get(o.eventId)) || getBranch(o.branchId).name}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{PAYMENT_LABEL[o.paymentMethod]}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-ink">
                    {peso(o.subtotal)}
                    {o.status !== "completed" && (
                      <span className="block text-[12px] font-normal text-ink-faint">
                        {STATUS_LABEL[o.status]}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
        <div className="mt-3">
          <Pagination
            page={history}
            noun="order"
            hrefFor={(n) => `/admin/customers/${profile.id}${n > 1 ? `?page=${n}` : ""}#history`}
          />
        </div>
      </section>
    </div>
  );
}
