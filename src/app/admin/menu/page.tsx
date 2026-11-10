import { redirect } from "next/navigation";
import { getMenu } from "@/lib/menu-store";
import { getStaffMember, isAdmin } from "@/lib/staff";
import { BRANCH_LIST, getBranch } from "@/lib/branches";
import { PageHeader } from "@/components/admin/report-ui";
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
      <PageHeader
        title="Menu"
        sub="Edit prices and details, which every branch shares, or mark an item sold out at a branch."
      />

      <MenuManager menu={menu} branches={branches} initialBranch={branches[0].id} />
    </div>
  );
}
