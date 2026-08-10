import Link from "next/link";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { getMenu } from "@/lib/menu-store";
import { ItemForm } from "../item-form";

export const dynamic = "force-dynamic";

export default async function NewItemPage() {
  const menu = await getMenu();

  return (
    <div className="mx-auto max-w-md">
      <Link
        href="/admin/menu"
        className="pressable inline-flex items-center gap-1 text-[14px] font-medium text-ink-soft hover:text-ink"
      >
        <CaretLeftIcon size={17} weight="bold" />
        Menu
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">Add an item</h1>
      <p className="mt-1 text-[14.5px] text-ink-soft">
        It joins the end of its category. Add-on options (size, milk) come from the
        category you choose.
      </p>

      <ItemForm categories={menu.categories} />
    </div>
  );
}
