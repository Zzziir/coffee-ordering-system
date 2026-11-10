import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRightIcon,
  CaretLeftIcon,
  CheckIcon,
  ClockIcon,
  GiftIcon,
  PhoneIcon,
  ReceiptIcon,
  WalletIcon,
} from "@phosphor-icons/react/dist/ssr";
import { getAdminOrder, type OrderStep } from "@/lib/admin-orders";
import { getBranch } from "@/lib/branches";
import { describeLine } from "@/lib/cart";
import { clsx } from "@/lib/clsx";
import { peso } from "@/lib/menu";
import { listEvents } from "@/lib/sales-events";
import {
  CHANNEL_LABEL,
  PAYMENT_LABEL,
  STATUS_FLOW,
  STATUS_LABEL,
  type OrderStatus,
} from "@/lib/types";
import { clock, duration, initials, longStamp, plural } from "@/components/admin/format";
import { Panel, StatTile } from "@/components/admin/report-ui";
import { EventSelect } from "../event-select";

export const dynamic = "force-dynamic";

const DEFAULT_BACK = { href: "/admin/orders", label: "Transactions" };

/**
 * Where the back link goes: the list the admin came from, filters and page
 * intact. Only back office paths are followed, so the parameter can't be used
 * to send someone off the site.
 */
function backLink(from: string | undefined) {
  if (!from || !from.startsWith("/admin") || from.startsWith("//")) return DEFAULT_BACK;
  const path = from.split(/[?#]/)[0];
  if (path === "/admin") return { href: from, label: "Overview" };
  if (path === "/admin/orders") return { href: from, label: "Transactions" };
  if (path.startsWith("/admin/customers/")) return { href: from, label: "Customer" };
  if (path.startsWith("/admin/events/")) return { href: from, label: "Event" };
  return { href: from, label: "Back" };
}

/** The latest time the order reached a status, if it ever did. */
const reached = (steps: OrderStep[], status: OrderStatus) => steps.findLast((s) => s.status === status);

export default async function AdminOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const [order, events] = await Promise.all([getAdminOrder(id), listEvents()]);
  if (!order) notFound();

  const back = backLink(from);
  const branch = getBranch(order.branchId);
  const units = order.items.reduce((sum, line) => sum + line.qty, 0);
  const itemsTotal = order.items.reduce((sum, line) => sum + line.lineTotal, 0);
  const ready = reached(order.steps, "ready");
  const done = order.status === "completed";

  return (
    <div className="flex flex-col gap-6">
      <div className="settle">
        <Link
          href={back.href}
          className="pressable -ml-1 inline-flex h-9 items-center gap-1 text-[14px] font-medium text-ink-soft hover:text-ink"
        >
          <CaretLeftIcon size={16} weight="bold" />
          {back.label}
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-ink">Order {order.code}</h1>
          <span
            className={clsx(
              "rounded-full px-2.5 py-1 text-[12.5px] font-semibold",
              order.status === "ready" || done ? "bg-ready-tint text-ready" : "bg-coffee-tint text-coffee",
            )}
          >
            {STATUS_LABEL[order.status]}
          </span>
          {!order.paid && (
            <span className="rounded-full bg-warn/10 px-2.5 py-1 text-[12.5px] font-semibold text-warn">
              Not paid yet
            </span>
          )}
        </div>
        <p className="mt-1 text-[14.5px] text-ink-soft">
          {branch.name} · {longStamp(order.createdAt)} · {CHANNEL_LABEL[order.channel]}
          {order.tableNumber && `, table ${order.tableNumber}`}
        </p>
      </div>

      <div className="settle grid grid-cols-2 gap-3 [animation-delay:40ms] lg:grid-cols-4">
        <StatTile
          icon={<ReceiptIcon size={20} weight="fill" />}
          label="Total"
          value={peso(order.subtotal)}
          sub={plural(units, "item")}
        />
        <StatTile
          icon={<WalletIcon size={20} weight="fill" />}
          label="Paid by"
          value={PAYMENT_LABEL[order.paymentMethod]}
          sub={order.paid ? "Payment received" : "Payment still due"}
        />
        <StatTile
          icon={<ClockIcon size={20} weight="fill" />}
          label="Ready in"
          value={ready ? duration(ready.at - order.createdAt) : "Not yet"}
          sub={ready ? `ready at ${clock(ready.at)}` : "still being made"}
        />
        <StatTile
          icon={<GiftIcon size={20} weight="fill" />}
          label="Free drinks"
          value={String(order.rewardQty)}
          sub={order.rewardQty > 0 ? `${peso(order.rewardDiscount)} off` : "no reward used"}
        />
      </div>

      <div className="settle grid items-start gap-6 [animation-delay:80ms] lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
        <div className="flex flex-col gap-6">
          <Panel title="Items" hint={`${plural(order.items.length, "line")}, ${plural(units, "item")}`}>
            <ul className="divide-y divide-line">
              {order.items.map((line) => {
                const extras = describeLine(line);
                return (
                  <li key={line.id} className="flex items-start gap-3.5 py-3.5 first:pt-0">
                    <span className="grid h-8 min-w-9 shrink-0 place-items-center rounded-[var(--radius-xs)] bg-coffee-tint px-1.5 text-[13px] font-bold tabular-nums text-coffee">
                      {line.qty}×
                    </span>
                    <div className="min-w-0 flex-1 pt-1">
                      <p className="text-[15px] font-semibold leading-tight text-ink">{line.name}</p>
                      {extras && <p className="mt-1 text-[13px] text-ink-soft">{extras}</p>}
                      {line.note && (
                        <p className="mt-1.5 border-l-2 border-line-strong pl-2.5 text-[13px] italic text-ink-soft">
                          {line.note}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 pt-1 text-right">
                      <p className="text-[15px] font-semibold tabular-nums text-ink">{peso(line.lineTotal)}</p>
                      {line.qty > 1 && (
                        <p className="text-[12.5px] tabular-nums text-ink-faint">
                          {peso(line.lineTotal / line.qty)} each
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <dl className="mt-1 flex flex-col gap-2 border-t border-dashed border-line-strong pt-4 text-[14px]">
              {order.rewardDiscount > 0 && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Items</dt>
                    <dd className="tabular-nums text-ink">{peso(itemsTotal)}</dd>
                  </div>
                  <div className="flex justify-between text-coffee">
                    <dt>
                      {order.rewardQty === 1 ? "Free drink reward" : `${order.rewardQty} free drink rewards`}
                    </dt>
                    <dd className="tabular-nums">-{peso(order.rewardDiscount)}</dd>
                  </div>
                </>
              )}
              <div className="flex items-baseline justify-between">
                <dt className="text-ink-soft">
                  {order.paid ? "Paid" : "Due"} · {PAYMENT_LABEL[order.paymentMethod]}
                </dt>
                <dd className="text-[22px] font-bold tracking-tight tabular-nums text-ink">
                  {peso(order.subtotal)}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Timeline" hint="Who moved it along, and when.">
            <Timeline steps={order.steps} createdAt={order.createdAt} />
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Customer">
            {order.customerId ? (
              <Link
                href={`/admin/customers/${order.customerId}`}
                className="lift-card flex items-center gap-3 rounded-[var(--radius-sm)] border border-line bg-paper px-3.5 py-3"
              >
                <Avatar name={order.customerName} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-ink">{order.customerName}</span>
                  <span className="block text-[12.5px] text-ink-soft">View their profile and history</span>
                </span>
                <ArrowRightIcon size={16} weight="bold" className="lift-arrow shrink-0 text-coffee" />
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Avatar name={order.customerName} />
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold text-ink">{order.customerName}</span>
                  <span className="block text-[12.5px] text-ink-soft">Guest, no account</span>
                </span>
              </div>
            )}
            {order.customerPhone && (
              <a
                href={`tel:${order.customerPhone}`}
                className="mt-3 inline-flex items-center gap-1.5 text-[14px] text-ink-soft hover:text-ink"
              >
                <PhoneIcon size={16} className="text-ink-faint" />
                {order.customerPhone}
              </a>
            )}
          </Panel>

          <Panel title="Sold at" hint="Counts toward this place in the sales reports.">
            <EventSelect
              orderId={order.id}
              orderCode={order.code}
              eventId={order.eventId}
              events={events.map((e) => ({ id: e.id, name: e.name }))}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="grid size-10 shrink-0 place-items-center rounded-full bg-coffee-tint text-[13px] font-semibold text-coffee"
    >
      {initials(name) || "?"}
    </span>
  );
}

/**
 * Each status in order, ticked when reached, with the time since the step
 * before. A column on a phone, a row of four from small screens up.
 */
function Timeline({ steps, createdAt }: { steps: OrderStep[]; createdAt: number }) {
  // Orders logged before staff names were recorded may lack a "received" step.
  const at = (status: OrderStatus) =>
    reached(steps, status) ?? (status === "received" ? { status, at: createdAt, staffName: null } : undefined);

  return (
    <ol className="grid gap-5 sm:grid-cols-4 sm:gap-3">
      {STATUS_FLOW.map((status, i) => {
        const step = at(status);
        const previous = i > 0 ? at(STATUS_FLOW[i - 1]) : undefined;
        const next = i < STATUS_FLOW.length - 1 ? at(STATUS_FLOW[i + 1]) : undefined;
        const last = i === STATUS_FLOW.length - 1;

        return (
          <li key={status} className="relative flex gap-3 sm:flex-col sm:gap-2.5">
            {!last && (
              <span
                aria-hidden
                className={clsx(
                  "absolute -bottom-5 left-[11px] top-6 w-0.5 rounded-full sm:-right-3 sm:bottom-auto sm:left-6 sm:top-[11px] sm:h-0.5 sm:w-auto",
                  step && next ? "bg-coffee" : "bg-line",
                )}
              />
            )}
            <span
              aria-hidden
              className={clsx(
                "relative grid size-6 shrink-0 place-items-center rounded-full",
                step ? "bg-coffee text-paper" : "border-2 border-line-strong bg-paper-raised",
              )}
            >
              {step && <CheckIcon size={12} weight="bold" />}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={clsx("text-[14px] leading-tight", step ? "font-semibold text-ink" : "text-ink-faint")}>
                {STATUS_LABEL[status]}
                {!step && <span className="sr-only"> (not yet)</span>}
              </p>
              {step && (
                <p className="mt-1 text-[12.5px] text-ink-soft">
                  {clock(step.at)}
                  {previous && step.at >= previous.at && (
                    <span className="text-ink-faint"> · {duration(step.at - previous.at)} later</span>
                  )}
                  {step.staffName && <span className="block text-ink-faint">by {step.staffName}</span>}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
