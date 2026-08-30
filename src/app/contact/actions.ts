"use server";

import { createInquiry, type InquiryInput, type InquiryKind } from "@/lib/inquiries";
import { notifyInquiry } from "@/lib/notify";

/**
 * The franchise / event-cart inquiry form on the contact page.
 *
 * Runs on the server so the write lands on the service role without ever
 * exposing a key to the browser. The form is public and unauthenticated, so a
 * honeypot catches the bots; everything else is plain validation.
 */

export type InquiryState = { ok: true } | { error: string } | null;

// Deliberately loose — enough to reject a typo, not to police real addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function submitInquiry(
  _previous: InquiryState,
  formData: FormData,
): Promise<InquiryState> {
  // Honeypot: a hidden field no human sees. If it's filled, a bot did it —
  // answer as if it worked so they don't retune, but save nothing.
  if (clean(formData, "company")) return { ok: true };

  const kind = clean(formData, "kind") as InquiryKind;
  if (kind !== "franchise" && kind !== "event") {
    return { error: "Please choose what you're interested in." };
  }

  const name = clean(formData, "name");
  const email = clean(formData, "email");
  if (!name) return { error: "Please tell us your name." };
  if (!EMAIL_RE.test(email)) return { error: "Enter an email we can reach you at." };

  const input: InquiryInput = {
    kind,
    name,
    email,
    phone: clean(formData, "phone") || null,
    message: clean(formData, "message") || null,
  };

  if (kind === "franchise") {
    input.preferredArea = clean(formData, "preferredArea") || null;
    input.timeline = clean(formData, "timeline") || null;
  } else {
    const guestsRaw = clean(formData, "guestCount");
    const guests = guestsRaw ? Number(guestsRaw) : null;
    if (guests !== null && (!Number.isInteger(guests) || guests < 0)) {
      return { error: "Estimated guests should be a whole number." };
    }
    input.eventType = clean(formData, "eventType") || null;
    input.eventDate = clean(formData, "eventDate") || null;
    input.venue = clean(formData, "venue") || null;
    input.guestCount = guests;
  }

  try {
    await createInquiry(input);
  } catch {
    return { error: "Something went wrong on our end. Please try again in a moment." };
  }

  // The lead is saved; alerting the team is best-effort and must not fail it.
  await notifyInquiry(input);

  return { ok: true };
}
