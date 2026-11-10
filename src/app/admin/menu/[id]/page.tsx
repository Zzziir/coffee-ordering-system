import { notFound } from "next/navigation";
import { getMenu } from "@/lib/menu-store";
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

  return <ItemForm categories={menu.categories} item={item} />;
}
