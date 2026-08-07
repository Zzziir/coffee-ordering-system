import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { OrderStatus } from "@/components/order-status";
import { CupMark } from "@/components/brand";
import { ChatLauncher } from "@/components/chat/chat-launcher";
import { getOrder } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);

  return (
    <div className="min-h-[100dvh]">
      <SiteNav />
      <div className="mx-auto max-w-2xl">
        {order ? (
          <OrderStatus initial={order} />
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
