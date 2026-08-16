import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { OrderStatus } from "@/components/order-status";
import { CupMark } from "@/components/brand";
import { ChatLauncher } from "@/components/chat/chat-launcher";
import { getOrder } from "@/lib/store";
import { getCustomer } from "@/lib/customer";
import { getLoyalty } from "@/lib/loyalty";
import { getMenu } from "@/lib/menu-store";
import { drinkStickers } from "@/lib/menu";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);

  // A signed-in viewer sees their real stamp balance on the card; a guest's
  // card falls back to the on-device tally (null here).
  const customer = await getCustomer();
  const loyalty = customer ? await getLoyalty(customer.id) : null;

  // What this order is worth in stamps: one per drink, less any comped free
  // drinks (those earn nothing). Credited only once the order is picked up;
  // before that the card previews them as "on the way".
  const menu = await getMenu();
  const stampsThisOrder = order
    ? Math.max(0, drinkStickers(menu, order.items) - order.rewardQty)
    : 0;

  return (
    <div className="min-h-[100dvh]">
      <SiteNav />
      <div className="mx-auto max-w-2xl">
        {order ? (
          <OrderStatus
            initial={order}
            loyalty={loyalty}
            stampsThisOrder={stampsThisOrder}
            credited={order.status === "completed"}
          />
        ) : (
          <main className="flex flex-col items-center justify-center px-6 pt-24 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-paper-sunk text-ink-faint">
            <CupMark className="size-9" />
          </span>
          <h1 className="mt-5 text-xl font-bold text-ink">Order not found</h1>
          <p className="mt-1.5 max-w-[30ch] text-[15px] leading-relaxed text-ink-soft">
            This order may have already been picked up, or the link expired.
          </p>
          <Link
            href="/menu"
            className="pressable mt-6 inline-flex h-12 items-center rounded-full bg-ink px-6 text-[15px] font-semibold text-paper"
          >
            Start a new order
          </Link>
          </main>
        )}
      </div>
      <ChatLauncher />
    </div>
  );
}
