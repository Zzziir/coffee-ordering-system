"use server";

import { revalidatePath } from "next/cache";
import { getStaffMember, isAdmin } from "@/lib/staff";
import { setInquiryStatus } from "@/lib/inquiries";
import { INQUIRY_STATUSES, type InquiryStatus } from "@/lib/inquiries";

/**
 * Advance a lead through triage from the admin inbox. The admin layout already
 * gates the page, but this re-checks: a server action is its own entry point,
 * so it can't lean on the page that renders the button.
 */
export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<void> {
  const staff = await getStaffMember();
  if (!staff || !isAdmin(staff)) throw new Error("Not authorized.");

  if (!INQUIRY_STATUSES.includes(status)) throw new Error("Unknown status.");

  await setInquiryStatus(id, status);
  revalidatePath("/admin/inquiries");
}
