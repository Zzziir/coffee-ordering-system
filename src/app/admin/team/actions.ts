"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getBranch, isBranchId } from "@/lib/branches";
import { getStaffMember, isAdmin, type StaffMember, type StaffRole } from "@/lib/staff";
import {
  createTeammate,
  getTeammate,
  setTeammateActive,
  setTeammateBranch,
  setTeammatePassword,
} from "@/lib/team";
import {
  MIN_PASSWORD_LENGTH,
  assignableBranches,
  canManage,
  canMoveBranch,
  manageableRoles,
  type Teammate,
} from "@/lib/team-rules";

/**
 * Team changes. They run on the service role (creating a login needs the auth
 * admin API), so the checks here are the authorisation, not a courtesy: every
 * action re-reads the caller and the target and applies team-rules.ts.
 */

const PATH = "/admin/team";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

async function requireAdmin(): Promise<StaffMember> {
  const staff = await getStaffMember();
  if (!staff || !isAdmin(staff)) redirect(`/staff/sign-in?next=${PATH}`);
  return staff;
}

/** The teammate, if this admin may manage them; otherwise a reason. */
async function manageable(actor: StaffMember, id: string): Promise<Teammate | string> {
  const target = await getTeammate(id);
  if (!target) return "That teammate no longer exists.";
  if (!canManage(actor, target)) return "You can't change this teammate's account.";
  return target;
}

function passwordProblem(password: string): string | null {
  return password.length < MIN_PASSWORD_LENGTH
    ? `Use at least ${MIN_PASSWORD_LENGTH} characters for the password.`
    : null;
}

const fail = (error: string): ActionResult => ({ ok: false, error });

/* ------------------------------------------------------------------ */

export type AddState = { ok: true; message: string } | { ok: false; error: string } | null;

export async function addTeammate(_previous: AddState, formData: FormData): Promise<AddState> {
  const actor = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "barista") as StaffRole;
  const branch = String(formData.get("branch") ?? "");

  if (!name) return fail("Enter their name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email address.");
  const weak = passwordProblem(password);
  if (weak) return fail(weak);
  if (!manageableRoles(actor).includes(role)) return fail("You can't add someone with that role.");
  if (!isBranchId(branch) || !assignableBranches(actor).includes(branch)) {
    return fail("Choose a branch you manage.");
  }

  const result = await createTeammate({ name, email, password, role, branchId: branch });
  if ("error" in result) return fail(result.error);

  revalidatePath(PATH);
  return { ok: true, message: `${name} can now sign in at ${getBranch(branch).name}.` };
}

export async function setActive(id: string, active: boolean): Promise<ActionResult> {
  const actor = await requireAdmin();
  const target = await manageable(actor, id);
  if (typeof target === "string") return fail(target);

  try {
    await setTeammateActive(id, active);
  } catch {
    return fail(`Couldn't ${active ? "reactivate" : "deactivate"} ${target.name}. Try again.`);
  }
  revalidatePath(PATH);
  return {
    ok: true,
    message: active ? `${target.name} can sign in again.` : `${target.name} can no longer sign in.`,
  };
}

export async function resetPassword(id: string, password: string): Promise<ActionResult> {
  const actor = await requireAdmin();
  const target = await manageable(actor, id);
  if (typeof target === "string") return fail(target);
  const weak = passwordProblem(password);
  if (weak) return fail(weak);

  try {
    await setTeammatePassword(id, password);
  } catch {
    return fail(`Couldn't change ${target.name}'s password. Try again.`);
  }
  return { ok: true, message: `${target.name}'s password is changed.` };
}

export async function moveBranch(id: string, branch: string): Promise<ActionResult> {
  const actor = await requireAdmin();
  if (!canMoveBranch(actor)) return fail("Only owners can move people between branches.");
  const target = await manageable(actor, id);
  if (typeof target === "string") return fail(target);
  if (!isBranchId(branch)) return fail("Choose a branch.");

  try {
    await setTeammateBranch(id, branch);
  } catch {
    return fail(`Couldn't move ${target.name}. Try again.`);
  }
  revalidatePath(PATH);
  return { ok: true, message: `${target.name} now works at ${getBranch(branch).name}.` };
}
