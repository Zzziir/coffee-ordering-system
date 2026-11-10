import { BRANCH_LIST } from "./branches";
import type { StaffMember, StaffRole } from "./staff";
import type { BranchId } from "./types";

/**
 * Who may change whom on the Team page. Pure, so the page and its client
 * components can read the same rules the server actions enforce.
 */

export type Teammate = {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  /** null only for owners, who work across every branch */
  branchId: BranchId | null;
  active: boolean;
  createdAt: string;
};

/** Temporary passwords are typed by one person and read by another. */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * The roles an admin may add or manage. Owners run the whole brand, so they
 * manage managers and baristas; a manager runs one branch's baristas. Owners
 * themselves are never managed here: that stays a deliberate database change.
 */
export function manageableRoles(actor: StaffMember): StaffRole[] {
  if (actor.role === "owner") return ["barista", "manager"];
  if (actor.role === "manager") return ["barista"];
  return [];
}

/** Branches an admin may place people in: all of them, or their own. */
export function assignableBranches(actor: StaffMember): BranchId[] {
  if (actor.role === "owner") return BRANCH_LIST.map((branch) => branch.id);
  return actor.branchId ? [actor.branchId] : [];
}

/** Whether `actor` may edit, deactivate or reset `target`. Never themselves. */
export function canManage(actor: StaffMember, target: Pick<Teammate, "id" | "role" | "branchId">): boolean {
  if (target.id === actor.id) return false;
  if (!manageableRoles(actor).includes(target.role)) return false;
  return actor.role === "owner" || (target.branchId !== null && target.branchId === actor.branchId);
}

/** Moving someone between branches only means anything to an owner. */
export function canMoveBranch(actor: StaffMember): boolean {
  return assignableBranches(actor).length > 1;
}

/** The roster this admin can see: everyone for owners, their branch for managers. */
export function visibleTo(actor: StaffMember, team: Teammate[]): Teammate[] {
  if (actor.role === "owner") return team;
  return team.filter((member) => member.id === actor.id || member.branchId === actor.branchId);
}

export const ROLE_LABEL: Record<StaffRole, string> = {
  owner: "Owner",
  manager: "Manager",
  barista: "Barista",
};
