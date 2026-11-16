import { redirect } from "next/navigation";
import { BRANCH_LIST, getBranch, isBranchId } from "@/lib/branches";
import { getStaffMember, isAdmin, type StaffRole } from "@/lib/staff";
import { listTeam } from "@/lib/team";
import {
  assignableBranches,
  canManage,
  canMoveBranch,
  manageableRoles,
  visibleTo,
  type Teammate,
} from "@/lib/team-rules";
import { hrefWith, initials } from "@/components/admin/format";
import {
  EmptyState,
  FilterPills,
  StickyHeader,
  TableShell,
  Th,
  tableHeadClass,
} from "@/components/admin/report-ui";
import { AddTeammate } from "./add-teammate";
import { MemberRow } from "./member-row";

export const dynamic = "force-dynamic";

const PATH = "/admin/team";

const ROLE_ORDER: Record<StaffRole, number> = { owner: 0, manager: 1, barista: 2 };

/** Active people first, then by seniority, then by name. */
function byRoster(a: Teammate, b: Teammate) {
  return (
    Number(b.active) - Number(a.active) ||
    ROLE_ORDER[a.role] - ROLE_ORDER[b.role] ||
    a.name.localeCompare(b.name)
  );
}

export default async function AdminTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const actor = await getStaffMember();
  if (!actor || !isAdmin(actor)) redirect(`/staff/sign-in?next=${PATH}`);

  const params = await searchParams;
  const isOwner = actor.role === "owner";
  const branchFilter = isOwner && isBranchId(params.branch) ? params.branch : null;

  const team = visibleTo(actor, await listTeam()).sort(byRoster);
  const shown = branchFilter
    ? team.filter((member) => member.branchId === branchFilter || member.branchId === null)
    : team;
  const activeCount = team.filter((member) => member.active).length;
  const movable = canMoveBranch(actor);

  const scope = isOwner ? "every branch" : getBranch(actor.branchId!).name;

  return (
    <div className="flex flex-col gap-6">
      <StickyHeader
        title="Team"
        sub={`Who can sign in to the barista boards and back office at ${scope}. ${activeCount} active ${activeCount === 1 ? "account" : "accounts"}.`}
        actions={<AddTeammate roles={manageableRoles(actor)} branches={assignableBranches(actor)} />}
        toolbar={
          isOwner && (
            <FilterPills
              label="Branch"
              options={[
                { href: PATH, label: "All branches", active: !branchFilter },
                ...BRANCH_LIST.map((branch) => ({
                  href: hrefWith(PATH, {}, { branch: branch.id }),
                  label: branch.name,
                  active: branchFilter === branch.id,
                })),
              ]}
            />
          )
        }
      />

      {shown.length === 0 ? (
        <EmptyState title="Nobody here yet">
          Add a barista and they can sign in to this branch&apos;s board straight away.
        </EmptyState>
      ) : (
        <TableShell minWidth="820px">
          <thead className={tableHeadClass}>
            <tr>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Branch</Th>
              <Th>Status</Th>
              <Th className="text-right">
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                initials={initials(member.name)}
                isYou={member.id === actor.id}
                manageable={canManage(actor, member)}
                movable={movable}
              />
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
