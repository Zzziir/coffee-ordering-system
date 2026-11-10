import { getMenu } from "@/lib/menu-store";
import { ItemForm } from "../item-form";

export const dynamic = "force-dynamic";

export default async function NewItemPage() {
  const menu = await getMenu();

  return <ItemForm categories={menu.categories} />;
}
