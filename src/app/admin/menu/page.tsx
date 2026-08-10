import Link from "next/link";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { getMenu } from "@/lib/menu-store";
import { MenuManager } from "./menu-manager";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const menu = await getMenu();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Menu</h1>
          <p className="mt-1 text-[14.5px] text-ink-soft">
            Edit prices and details, or switch an item off when it sells out.
          </p>
        </div>
        <Link
          href="/admin/menu/new"
          className="pressable flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-ink pl-4 pr-5 text-[14px] font-semibold text-paper"
        >
          <PlusIcon size={17} weight="bold" />
          Add item
        </Link>
      </div>

      <MenuManager menu={menu} />
    </div>
  );
}
