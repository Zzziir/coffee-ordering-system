"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getStaffMember, isAdmin } from "@/lib/staff";
import { isBranchId } from "@/lib/branches";
import { setOrderEvent } from "@/lib/admin-orders";
import {
  closeEvent,
  createEvent,
  getEvent,
  reopenEvent,
  updateEvent,
  type SalesEventInput,
} from "@/lib/sales-events";

/**
 * Writes for bazaars and events. Each action re-checks the admin gate itself:
 * a server action is its own entry point and can't lean on the layout.
 */

async function assertAdmin() {
  const staff = await getStaffMember();
  if (!staff || !isAdmin(staff)) redirect("/staff/sign-in?next=/admin/events");
}

export type EventFormState = { error: string } | null;

const text = (formData: FormData, name: string) =>
  String(formData.get(name) ?? "").trim() || null;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** A peso amount from a form field: null when blank, NaN when not a whole, non-negative number. */
function pesos(formData: FormData, name: string): number | null {
  const raw = String(formData.get(name) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : Number.NaN;
}

function readEvent(formData: FormData): SalesEventInput | { error: string } {
  const name = text(formData, "name");
  if (!name) return { error: "Give the event a name." };

  const branchId = String(formData.get("branchId") ?? "");
  if (!isBranchId(branchId)) return { error: "Pick the branch running the booth." };

  const startsOn = text(formData, "startsOn");
  const endsOn = text(formData, "endsOn");
  if ((startsOn && !ISO_DAY.test(startsOn)) || (endsOn && !ISO_DAY.test(endsOn))) {
    return { error: "Check the dates." };
  }
  if (startsOn && endsOn && endsOn < startsOn) {
    return { error: "The end date is before the start date." };
  }

  const openingCash = pesos(formData, "openingCash");
  if (Number.isNaN(openingCash)) return { error: "Opening cash must be a whole peso amount." };

  return {
    name,
    venue: text(formData, "venue"),
    city: text(formData, "city"),
    organizer: text(formData, "organizer"),
    branchId,
    startsOn,
    endsOn,
    openingCash,
    cashNote: text(formData, "cashNote"),
  };
}

/** Create an event, or update the one named by the hidden `id` field. */
export async function saveEvent(
  _previous: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await assertAdmin();

  const input = readEvent(formData);
  if ("error" in input) return input;

  const id = text(formData, "id");
  const eventId = id ?? (await createEvent(input));
  if (id) await updateEvent(id, input);

  revalidatePath("/admin/events");
  // FlashToast on the event page confirms the save.
  redirect(`/admin/events/${eventId}?notice=${id ? "event-saved" : "event-created"}`);
}

export type CloseEventState = { error: string } | null;

/** Record the till count and close the event to new sales. */
export async function closeEventAction(formData: FormData): Promise<CloseEventState> {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  const closingCash = pesos(formData, "closingCash");
  if (Number.isNaN(closingCash)) return { error: "Enter the cash counted as a whole peso amount." };

  await closeEvent(id, closingCash);
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);
  return null;
}

export async function reopenEventAction(id: string): Promise<void> {
  await assertAdmin();

  await reopenEvent(id);
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);
}

/** Move a sale onto an event, or back to a plain store sale with null. */
export async function moveOrder(orderId: string, eventId: string | null): Promise<void> {
  await assertAdmin();

  if (eventId && !(await getEvent(eventId))) throw new Error("That event no longer exists.");

  await setOrderEvent(orderId, eventId);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/events");
  revalidatePath("/admin/sales");
}
