import { redirect } from "next/navigation";
import { BRANCH_LIST, getBranch, isBranchId } from "@/lib/branches";
import { clsx } from "@/lib/clsx";
import { getStaffMember, isAdmin, type StaffRole } from "@/lib/staff";
import { listTeam } from "@/lib/team";
import {
  ROLE_LABEL,
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
  PageHeader,
  TableShell,
  Th,
  tableHeadClass,
} from "@/components/admin/report-ui";
import { AddTeammate } from "./add-teammate";
import { MemberActions, MoveBranch } from "./member-controls";

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
      <PageHeader
        title="Team"
        sub={`Who can sign in to the barista boards and back office at ${scope}. ${activeCount} active ${activeCount === 1 ? "account" : "accounts"}.`}
      >
        <AddTeammate roles={manageableRoles(actor)} branches={assignableBranches(actor)} />
      </PageHeader>

      {isOwner && (
        <div className="flex">
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
        </div>
      )}

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
            {shown.map((member) => {
              const manageable = canManage(actor, member);
              const isYou = member.id === actor.id;
              return (
                <tr
                  key={member.id}
                  className={clsx("quiet-hover bg-paper-raised align-middle", !member.active && "text-ink-faint")}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className={clsx(
                          "grid size-10 shrink-0 place-items-center rounded-full text-[13px] font-semibold",
                          member.active ? "bg-coffee-tint text-coffee" : "bg-paper-sunk text-ink-faint",
                        )}
                      >
                        {initials(member.name)}
                      </span>
                      <div className="min-w-0">
                        <p className={clsx("truncate font-semibold", member.active ? "text-ink" : "text-ink-soft")}>
                          {member.name}
                          {isYou && (
                            <span className="ml-2 rounded-full bg-paper-sunk px-2 py-0.5 text-[11.5px] font-medium text-ink-soft">
                              You
                            </span>
                          )}
                        </p>
                        <p className="truncate text-[13px] text-ink-faint">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{ROLE_LABEL[member.role]}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {member.branchId === null ? (
                      "All branches"
                    ) : movable && manageable && member.active ? (
                      <MoveBranch id={member.id} name={member.name} branchId={member.branchId} />
                    ) : (
                      getBranch(member.branchId).name
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-[13.5px]">
                      <span
                        aria-hidden
                        className={clsx("size-2 rounded-full", member.active ? "bg-ready" : "bg-ink-faint/60")}
                      />
                      <span className={member.active ? "text-ink" : "text-ink-faint"}>
                        {member.active ? "Active" : "Deactivated"}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {manageable && (
                      <MemberActions id={member.id} name={member.name} active={member.active} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
