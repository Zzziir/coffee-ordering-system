import type { BranchId } from "./types";
import { isBranchId } from "./branches";
import { createServerSupabase } from "./supabase/server";

/**
 * Who is at the till, and what they're allowed to open.
 *
 * The `staff` table is the roster; Supabase Auth is only the credential. An
 * account can be authenticated and still not be staff, so every check here
 * fails closed — no staff row means no access.
 */

export type StaffRole = "barista" | "manager" | "owner";

export type StaffMember = {
  id: string;
  email: string;
  name: string;
  /** null only for owners, who work across every branch */
  branchId: BranchId | null;
  role: StaffRole;
};

/** The signed-in staff member, or null if nobody is signed in. */
export async function getStaffMember(): Promise<StaffMember | null> {
  const supabase = await createServerSupabase();

  // getUser, not getSession: this revalidates the JWT with Supabase rather than
  // trusting a cookie the browser handed us.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("staff")
    .select("id, email, name, branch_id, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    branchId: isBranchId(data.branch_id) ? data.branch_id : null,
    role: data.role as StaffRole,
  };
}

/** Owners work across every branch; everyone else is pinned to their own. */
export function canAccessBranch(staff: StaffMember, branchId: BranchId): boolean {
  return staff.role === "owner" || staff.branchId === branchId;
}

/**
 * Admins run the back office: sales analytics, manual order logging, and the
 * menu. Owners and managers qualify; a barista does not. Mirrors is_staff_admin()
 * in the database (0005_menu.sql), which guards the same writes under RLS.
 */
export function isAdmin(staff: StaffMember): boolean {
  return staff.role === "owner" || staff.role === "manager";
}

/** Where signing in should land this person: their board, or the branch list. */
export function landingPath(staff: StaffMember): string {
  return staff.branchId ? `/staff/${staff.branchId}` : "/staff";
}

/**
 * Resolve a `?next=` hop after sign-in. Only ever returns a branch board this
 * person may open, so a crafted link can't bounce them somewhere else.
 */
export function safeLandingPath(staff: StaffMember, next: string | null): string {
  const requested = next?.startsWith("/staff/") ? next.slice("/staff/".length) : "";
  return isBranchId(requested) && canAccessBranch(staff, requested)
    ? `/staff/${requested}`
    : landingPath(staff);
}
