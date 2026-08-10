import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { getMenu, } from "@/lib/menu-store";
import { getItem } from "@/lib/menu";
import { ItemForm } from "../item-form";

export const dynamic = "force-dynamic";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const menu = await getMenu();
  const item = getItem(menu, id);
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-md">
      <Link
        href="/admin/menu"
        className="pressable inline-flex items-center gap-1 text-[14px] font-medium text-ink-soft hover:text-ink"
      >
        <CaretLeftIcon size={17} weight="bold" />
        Menu
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">Edit item</h1>
      <p className="mt-1 text-[14.5px] text-ink-soft">{item.name}</p>

      <ItemForm categories={menu.categories} item={item} />
    </div>
  );
}
