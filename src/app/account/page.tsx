import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  PencilSimpleIcon,
  ReceiptIcon,
  CaretRightIcon,
  CoffeeIcon,
  GiftIcon,
} from "@phosphor-icons/react/dist/ssr";
import { SiteHeader } from "@/components/site-header";
import { StampCard } from "@/components/stamp-card";
import { ActiveOrders } from "@/components/active-orders";
import { RewardUnlockModal } from "@/components/reward-unlock-modal";
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

  // Stamps not yet credited: an in-progress order earns them at pickup. Shown
  // as "on the way" so the card previews what's coming.
  const pendingStamps = activeOrders.reduce(
    (total, o) => total + Math.max(0, drinkStickers(menu, o.items) - o.rewardQty),
    0,
  );

  const initials = `${customer.firstName[0] ?? ""}${customer.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader back="/" showBag={false} title="Account" wide />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 pt-6 lg:px-8 lg:pt-10">
        {/* Identity */}
        <header className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-coffee to-coffee-deep text-[20px] font-bold text-paper shadow-[var(--shadow-card)] lg:size-16 lg:text-[23px]">
            {initials}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-[26px] font-bold tracking-tight text-ink lg:text-[32px]">
              Hi, {customer.firstName}
            </h1>
            <p className="mt-0.5 truncate text-[14.5px] text-ink-soft">{customer.email}</p>
          </div>
        </header>

        {/* At-a-glance stats */}
        <div className="mt-6 grid grid-cols-3 gap-3 lg:mt-8 lg:gap-4">
          <Stat icon={<ReceiptIcon size={18} weight="fill" />} value={orders.length} label="Orders" />
          <Stat icon={<CoffeeIcon size={18} weight="fill" />} value={loyalty.stamps} label="Stamps earned" />
          <Stat icon={<GiftIcon size={18} weight="fill" />} value={loyalty.free} label="Free drinks" />
        </div>

        {/* Celebrate once a picked-up order completes a card (once per account) */}
        <RewardUnlockModal
          earnedRewards={loyalty.earnedRewards}
          celebrated={loyalty.celebrated}
          free={loyalty.free}
        />

        {/* Active orders lead, full width, since they're time-sensitive. */}
        {activeOrders.length > 0 && (
          <div className="mt-6 lg:mt-8">
            <ActiveOrders initial={activeOrders} />
          </div>
        )}

        {/* A balanced pair: the rewards card and order history share the row at
            equal width, so neither side out-weighs the other. */}
        <div className="mt-6 grid gap-5 lg:mt-8 lg:grid-cols-2 lg:items-start lg:gap-6">
          <StampCard stamps={loyalty.stamps} free={loyalty.free} pending={pendingStamps} />

          <section className="rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5 shadow-[var(--shadow-card)] lg:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-ink">Order history</h2>
              {pastOrders.length > 0 && (
                <span className="text-[13px] text-ink-soft">
                  {pastOrders.length} {pastOrders.length === 1 ? "order" : "orders"}
                </span>
              )}
            </div>

            {orders.length === 0 ? (
              <div className="mt-4 flex flex-col items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-line px-5 py-10 text-center">
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
              <p className="mt-4 text-[14.5px] text-ink-soft">
                Your past orders will show here once they&apos;re picked up.
              </p>
            ) : (
              <ul className="mt-2 flex flex-col divide-y divide-line">
                {pastOrders.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Profile spans the full width as a calm footer band. */}
        <section className="mt-5 rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5 shadow-[var(--shadow-card)] lg:mt-6 lg:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-ink">Your details</h2>
            <Link
              href="/account/edit"
              className="pressable flex items-center gap-1.5 text-[13.5px] font-medium text-coffee"
            >
              <PencilSimpleIcon size={14} weight="bold" />
              Edit
            </Link>
          </div>
          <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            <Detail label="Name" value={`${customer.firstName} ${customer.lastName}`} />
            <Detail label="Mobile" value={customer.phone || "Not set"} />
            <Detail label="Age" value={customer.age ? String(customer.age) : "Not set"} />
            <Detail label="Favorite flavor" value={customer.favoriteFlavor || "Not set"} />
          </dl>
        </section>

        <div className="mt-8 lg:mx-auto lg:max-w-sm">
          <SignOutButton />
        </div>
      </main>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-[var(--radius-md)] border border-line bg-paper-raised p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:gap-3.5 lg:p-5">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-coffee-tint text-coffee sm:size-11">
        {icon}
      </span>
      <div>
        <p className="text-[22px] font-bold leading-none text-ink lg:text-[26px]">{value}</p>
        <p className="mt-1.5 text-[12.5px] leading-tight text-ink-soft">{label}</p>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12.5px] text-ink-faint">{label}</dt>
      <dd className="mt-1 truncate text-[15px] font-medium text-ink">{value}</dd>
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
        className="group flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-3 transition-colors hover:bg-paper-sunk/60"
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
        <CaretRightIcon
          size={17}
          weight="bold"
          className="shrink-0 text-ink-faint transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </Link>
    </li>
  );
}
