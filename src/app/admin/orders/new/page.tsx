import { getMenu } from "@/lib/menu-store";
import { NewOrderForm } from "./new-order-form";

export const dynamic = "force-dynamic";

export default async function LogOrderPage() {
  const menu = await getMenu();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Log an order</h1>
      <p className="mt-1 text-[14.5px] text-ink-soft">
        Ring up an in-store sale. It goes on the barista board and into today's
        totals.
      </p>

      <div className="mt-6">
        <NewOrderForm menu={menu} />
      </div>
    </div>
  );
}
