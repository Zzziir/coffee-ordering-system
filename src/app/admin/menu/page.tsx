import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { getMenu } from "@/lib/menu-store";
import { getStaffMember, isAdmin } from "@/lib/staff";
import { BRANCH_LIST, getBranch } from "@/lib/branches";
import { MenuManager } from "./menu-manager";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const [menu, staff] = await Promise.all([getMenu(), getStaffMember()]);
  // The layout already gates admins in; we re-resolve the staff here for their
  // role and branch, which decide who can set availability where.
  if (!staff || !isAdmin(staff)) redirect("/staff/sign-in?next=/admin/menu");

  // Owners manage every branch's availability; a manager only their own store.
  const branches =
    staff.role === "owner"
      ? BRANCH_LIST.map((b) => ({ id: b.id, name: b.name }))
      : staff.branchId
        ? [{ id: staff.branchId, name: getBranch(staff.branchId).name }]
        : [];
  if (branches.length === 0) redirect("/staff");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Menu</h1>
          <p className="mt-1 text-[14.5px] text-ink-soft">
            Edit prices and details, or mark an item sold out at a branch.
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

      <MenuManager menu={menu} branches={branches} initialBranch={branches[0].id} />
    </div>
  );
}
