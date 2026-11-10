import { isBranchId } from "./branches";
import type { StaffRole } from "./staff";
import type { Teammate } from "./team-rules";
import { supabaseAdmin } from "./supabase/admin";
import type { BranchId } from "./types";

/**
 * Reads and writes for the staff roster.
 *
 * SERVER ONLY. Staff accounts are Supabase Auth users plus a `staff` row, so
 * creating one or changing a password needs the auth admin API, which only the
 * service role can call. The rules in team-rules.ts are therefore the real
 * gate: every Team action checks them before calling anything here.
 */

type StaffRow = {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  branch_id: string | null;
  deactivated_at: string | null;
  created_at: string;
};

const STAFF_COLUMNS = "id, email, name, role, branch_id, deactivated_at, created_at";

function toTeammate(row: StaffRow): Teammate {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    branchId: isBranchId(row.branch_id) ? row.branch_id : null,
    active: row.deactivated_at === null,
    createdAt: row.created_at,
  };
}

export async function listTeam(): Promise<Teammate[]> {
  const { data, error } = await supabaseAdmin()
    .from("staff")
    .select(STAFF_COLUMNS)
    .order("name");
  if (error) throw new Error(`Could not load the team: ${error.message}`);
  return (data as StaffRow[]).map(toTeammate);
}

export async function getTeammate(id: string): Promise<Teammate | null> {
  const { data, error } = await supabaseAdmin()
    .from("staff")
    .select(STAFF_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load that teammate: ${error.message}`);
  return data ? toTeammate(data as StaffRow) : null;
}

/** Creates the login and the roster row together, undoing the login if the row fails. */
export async function createTeammate(input: {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
  branchId: BranchId;
}): Promise<{ ok: true } | { error: string }> {
  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    // The admin vouches for the address; there is no confirmation email to wait on.
    email_confirm: true,
    user_metadata: { name: input.name },
  });
  if (error || !data.user) {
    return {
      error: /already|exists|registered/i.test(error?.message ?? "")
        ? "That email already has a Craffé account. Use a different email."
        : `Couldn't create the login: ${error?.message ?? "unknown error"}`,
    };
  }

  const { error: rowError } = await admin.from("staff").insert({
    id: data.user.id,
    email: input.email,
    name: input.name,
    role: input.role,
    branch_id: input.branchId,
  });
  if (rowError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: `Couldn't add them to the team: ${rowError.message}` };
  }
  return { ok: true };
}

// Supabase bans take a duration; a century is "until someone lifts it".
const INDEFINITE_BAN = "876000h";

/** Switches sign-in off or back on. The row stays either way. */
export async function setTeammateActive(id: string, active: boolean): Promise<void> {
  const admin = supabaseAdmin();
  const { error: banError } = await admin.auth.admin.updateUserById(id, {
    ban_duration: active ? "none" : INDEFINITE_BAN,
  });
  if (banError) throw new Error(banError.message);

  const { error } = await admin
    .from("staff")
    .update({ deactivated_at: active ? null : new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setTeammatePassword(id: string, password: string): Promise<void> {
  const { error } = await supabaseAdmin().auth.admin.updateUserById(id, { password });
  if (error) throw new Error(error.message);
}

export async function setTeammateBranch(id: string, branchId: BranchId): Promise<void> {
  const { error } = await supabaseAdmin().from("staff").update({ branch_id: branchId }).eq("id", id);
  if (error) throw new Error(error.message);
}
