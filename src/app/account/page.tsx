import Link from "next/link";
import { redirect } from "next/navigation";
import {
  PencilSimpleIcon,
  ReceiptIcon,
  CaretRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import { SiteHeader } from "@/components/site-header";
import { StampCard } from "@/components/stamp-card";
import { ActiveOrders } from "@/components/active-orders";
import { getCustomer } from "@/lib/customer";
import { listCustomerOrders } from "@/lib/store";
import { getLoyalty } from "@/lib/loyalty";
import { getMenu } from "@/lib/menu-store";
import { drinkStickers, peso } from "@/lib/menu";
import { getBranch } from "@/lib/branches";
import { STATUS_LABEL, type Order } from "@/lib/types";
import { SignOutButton } from "./sign-out-button";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const customer = await getCustomer();
  // proxy.ts already gates this route; this is the belt-and-braces check.
  if (!customer) redirect("/account/sign-in?next=/account");

  const [orders, loyalty, menu] = await Promise.all([
    listCustomerOrders(customer.id),
    getLoyalty(customer.id),
    getMenu(),
  ]);

  // Active = still on its way (not yet picked up). These lead the page and live
  // in their own section; history keeps the picked-up ones so nothing doubles.
  const activeOrders = orders.filter((o) => o.status !== "completed");
  const pastOrders = orders.filter((o) => o.status === "completed");

  // Stamps not yet credited: an unpaid (cash) order earns them at pickup. Shown
  // as "on the way" so the card previews what's coming.
  const pendingStamps = activeOrders
    .filter((o) => !o.paid)
    .reduce((total, o) => total + Math.max(0, drinkStickers(menu, o.items) - o.rewardQty), 0);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader back="/" showBag={false} title="Account" />

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-20 pt-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Hi, {customer.firstName}
        </h1>
        <p className="mt-1 text-[14.5px] text-ink-soft">{customer.email}</p>

        {/* Loyalty */}
        <div className="mt-6">
          <StampCard stamps={loyalty.stamps} free={loyalty.free} pending={pendingStamps} />
        </div>

        {/* Active orders — live, so a status changes without a refresh */}
        <ActiveOrders initial={activeOrders} />

        {/* Profile */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-ink">Your details</h2>
            <Link
              href="/account/edit"
              className="pressable flex items-center gap-1.5 text-[14px] font-medium text-coffee"
            >
              <PencilSimpleIcon size={15} weight="bold" />
              Edit
            </Link>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            <Detail label="Name" value={`${customer.firstName} ${customer.lastName}`} />
            <Detail label="Mobile" value={customer.phone || "Not set"} />
            <Detail label="Age" value={customer.age ? String(customer.age) : "Not set"} />
            <Detail
              label="Favorite flavor"
              value={customer.favoriteFlavor || "Not set"}
            />
          </dl>
        </section>

        {/* Order history */}
        <section className="mt-8">
          <h2 className="text-[15px] font-semibold text-ink">Order history</h2>
          {orders.length === 0 ? (
            <div className="mt-3 flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-line bg-paper-raised px-5 py-10 text-center">
              <ReceiptIcon size={28} weight="regular" className="text-ink-faint" />
              <p className="text-[14.5px] text-ink-soft">
                No orders yet. Your next one will show up here.
              </p>
              <Link
                href="/menu"
                className="pressable mt-1 flex h-11 items-center rounded-full bg-ink px-6 text-[15px] font-semibold text-paper"
              >
                Start an order
              </Link>
            </div>
          ) : pastOrders.length === 0 ? (
            <p className="mt-3 text-[14.5px] text-ink-soft">
              Your past orders will show here once they&apos;re picked up.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2.5">
              {pastOrders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </ul>
          )}
        </section>

        <div className="mt-10">
          <SignOutButton />
        </div>
      </main>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-line bg-paper-raised px-4 py-3">
      <dt className="text-[12.5px] text-ink-faint">{label}</dt>
      <dd className="mt-0.5 truncate text-[15px] font-medium text-ink">{value}</dd>
    </div>
  );
}

const dateFmt = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function OrderRow({ order }: { order: Order }) {
  const count = order.items.reduce((n, l) => n + l.qty, 0);
  return (
    <li>
      <Link
        href={`/order/${order.id}`}
        className="pressable flex items-center gap-3 rounded-[var(--radius-md)] border border-line bg-paper-raised px-4 py-3.5"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-coffee-tint/70 text-[14px] font-bold text-coffee">
          {order.code}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-ink">
            {getBranch(order.branchId).name} · {peso(order.subtotal)}
          </span>
          <span className="block text-[12.5px] text-ink-soft">
            {dateFmt.format(order.createdAt)} · {count}{" "}
            {count === 1 ? "item" : "items"} · {STATUS_LABEL[order.status]}
          </span>
        </span>
        <CaretRightIcon size={17} weight="bold" className="shrink-0 text-ink-faint" />
      </Link>
    </li>
  );
}
