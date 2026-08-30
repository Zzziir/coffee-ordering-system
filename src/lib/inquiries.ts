import { supabaseAdmin } from "./supabase/admin";

/**
 * Franchise and event-cart leads from the contact page. Both kinds share one
 * shape; the fields that don't apply to a kind are simply left null.
 */

export type InquiryKind = "franchise" | "event";

export type InquiryInput = {
  kind: InquiryKind;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  // Franchise
  preferredArea?: string | null;
  timeline?: string | null;
  // Event
  eventType?: string | null;
  eventDate?: string | null; // ISO date, e.g. "2026-12-24"
  venue?: string | null;
  guestCount?: number | null;
};

/**
 * Persist a lead. Runs on the service role — the contact form is public, so the
 * write is authorised by the server action that calls this, not by the caller's
 * session (there usually isn't one). Mirrors the order store's model.
 */
export async function createInquiry(input: InquiryInput): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("partner_inquiries")
    .insert({
      kind: input.kind,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      message: input.message ?? null,
      preferred_area: input.preferredArea ?? null,
      timeline: input.timeline ?? null,
      event_type: input.eventType ?? null,
      event_date: input.eventDate ?? null,
      venue: input.venue ?? null,
      guest_count: input.guestCount ?? null,
    });

  if (error) throw new Error(`Could not save the inquiry: ${error.message}`);
}
