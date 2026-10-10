import { dayKey } from "@/lib/analytics";
import { getMenu } from "@/lib/menu-store";
import { coversDay, listEvents } from "@/lib/sales-events";
import { NewOrderForm } from "./new-order-form";

export const dynamic = "force-dynamic";

export default async function LogOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const [{ event: requested }, menu, events] = await Promise.all([
    searchParams,
    getMenu(),
    listEvents(),
  ]);

  const open = events.filter((e) => e.status === "active");

  // Opened from an event page, that event wins. Otherwise, when exactly one
  // bazaar is on today the till starts on it. With two or more it would be a
  // guess, so the cashier picks.
  const today = dayKey(Date.now());
  const onToday = open.filter((e) => coversDay(e, today));
  const defaultEventId =
    open.find((e) => e.id === requested)?.id ?? (onToday.length === 1 ? onToday[0].id : null);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Log an order</h1>
      <p className="mt-1 text-[14.5px] text-ink-soft">
        Ring up an in-store sale or a sale at a bazaar. Store sales go on the barista board;
        both go into today&apos;s totals.
      </p>

      <div className="mt-6">
        <NewOrderForm
          menu={menu}
          events={open.map((e) => ({ id: e.id, name: e.name, branchId: e.branchId }))}
          defaultEventId={defaultEventId}
        />
      </div>
    </div>
  );
}
