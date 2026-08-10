import Link from "next/link";
import { TrendUpIcon, ReceiptIcon, UsersIcon, CoffeeIcon } from "@phosphor-icons/react/dist/ssr";
import { listRecentOrders } from "@/lib/store";
import { peso } from "@/lib/menu";
import { BRANCH_LIST, getBranch } from "@/lib/branches";
import { STATUS_LABEL, type Order } from "@/lib/types";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;
const manilaDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" });
const stamp = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const revenueOf = (orders: Order[]) => orders.reduce((sum, o) => sum + o.subtotal, 0);

export default async function AdminOverviewPage() {
  const orders = await listRecentOrders();
  const paid = orders.filter((o) => o.paid);

  const now = Date.now();
  const today = manilaDay.format(now);
  const paidToday = paid.filter((o) => manilaDay.format(o.createdAt) === today);
  const paid7 = paid.filter((o) => o.createdAt >= now - 7 * DAY);
  const activeCount = orders.filter((o) => o.status !== "completed").length;

  // Top sellers by quantity, from every paid order's lines.
  const items = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const order of paid) {
    for (const line of order.items) {
      const row = items.get(line.itemId) ?? { name: line.name, qty: 0, revenue: 0 };
      row.qty += line.qty;
      row.revenue += line.lineTotal;
      items.set(line.itemId, row);
    }
  }
  const topItems = [...items.values()].sort((a, b) => b.qty - a.qty).slice(0, 6);

  // Revenue and order count per branch, all-time.
  const byBranch = BRANCH_LIST.map((branch) => {
    const list = paid.filter((o) => o.branchId === branch.id);
    return { branch, revenue: revenueOf(list), count: list.length };
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Overview</h1>
        <p className="mt-1 text-[14.5px] text-ink-soft">
          Sales across every branch. Paid orders only.
        </p>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={<TrendUpIcon size={20} weight="fill" />}
          label="Sales today"
          value={peso(revenueOf(paidToday))}
          sub={`${paidToday.length} ${paidToday.length === 1 ? "order" : "orders"}`}
        />
        <Stat
          icon={<ReceiptIcon size={20} weight="fill" />}
          label="Last 7 days"
          value={peso(revenueOf(paid7))}
          sub={`${paid7.length} ${paid7.length === 1 ? "order" : "orders"}`}
        />
        <Stat
          icon={<CoffeeIcon size={20} weight="fill" />}
          label="All-time sales"
          value={peso(revenueOf(paid))}
          sub={`${paid.length} paid`}
        />
        <Stat
          icon={<UsersIcon size={20} weight="fill" />}
          label="In progress"
          value={String(activeCount)}
          sub="not yet picked up"
        />
      </div>

      {/* By branch + top sellers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-[15px] font-semibold text-ink">By branch</h2>
          <div className="mt-3 flex flex-col gap-2.5">
            {byBranch.map(({ branch, revenue, count }) => (
              <div
                key={branch.id}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-line bg-paper-raised px-4 py-3.5"
              >
                <div>
                  <p className="text-[15px] font-semibold text-ink">{branch.name}</p>
                  <p className="text-[12.5px] text-ink-soft">
                    {count} {count === 1 ? "order" : "orders"}
                  </p>
                </div>
                <p className="text-[16px] font-semibold tabular-nums text-ink">
                  {peso(revenue)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-ink">Top sellers</h2>
          {topItems.length === 0 ? (
            <p className="mt-3 text-[14px] text-ink-soft">No sales yet.</p>
          ) : (
            <ol className="mt-3 flex flex-col gap-2">
              {topItems.map((item, i) => (
                <li
                  key={item.name}
                  className="flex items-center gap-3 rounded-[var(--radius-md)] border border-line bg-paper-raised px-4 py-3"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-coffee-tint/70 text-[13px] font-bold text-coffee">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14.5px] font-medium text-ink">
                    {item.name}
                  </span>
                  <span className="shrink-0 text-[13px] text-ink-soft">
                    {item.qty} sold · {peso(item.revenue)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* Recent orders */}
      <section>
        <h2 className="text-[15px] font-semibold text-ink">Recent orders</h2>
        <div className="mt-3 overflow-x-auto rounded-[var(--radius-md)] border border-line">
          <table className="w-full min-w-[560px] text-left text-[14px]">
            <thead className="bg-paper-sunk text-[12.5px] uppercase tracking-wide text-ink-faint">
              <tr>
                <Th>Code</Th>
                <Th>Branch</Th>
                <Th>When</Th>
                <Th>Status</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.slice(0, 12).map((o) => (
                <tr key={o.id} className="bg-paper-raised">
                  <td className="px-4 py-3 font-semibold text-ink">{o.code}</td>
                  <td className="px-4 py-3 text-ink-soft">{getBranch(o.branchId).name}</td>
                  <td className="px-4 py-3 text-ink-soft">{stamp.format(o.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-paper-sunk px-2.5 py-1 text-[12px] font-medium text-ink-soft">
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">
                    {peso(o.subtotal)}
                    {!o.paid && <span className="ml-1 text-[11px] text-warn">unpaid</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <p className="mt-4 text-center text-[14px] text-ink-soft">
            No orders yet.{" "}
            <Link href="/admin/orders/new" className="font-semibold text-coffee">
              Log the first one
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-line bg-paper-raised p-4">
      <div className="flex items-center gap-2 text-coffee">
        {icon}
        <span className="text-[12.5px] font-medium text-ink-soft">{label}</span>
      </div>
      <p className="mt-2 text-[22px] font-bold tracking-tight text-ink">{value}</p>
      <p className="text-[12.5px] text-ink-faint">{sub}</p>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 font-semibold ${className ?? ""}`}>{children}</th>;
}
