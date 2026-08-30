import { supabaseAdmin } from "./supabase/admin";

/**
 * Franchise and event-cart leads from the contact page. Both kinds share one
 * shape; the fields that don't apply to a kind are simply left null.
 */

export type InquiryKind = "franchise" | "event";

/** Triage state for the admin inbox. */
export type InquiryStatus = "new" | "contacted" | "closed";

export const INQUIRY_STATUSES: InquiryStatus[] = ["new", "contacted", "closed"];

/** A saved lead, as read back for the admin inbox. */
export type Inquiry = {
  id: string;
  kind: InquiryKind;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  preferredArea: string | null;
  timeline: string | null;
  eventType: string | null;
  eventDate: string | null;
  venue: string | null;
  guestCount: number | null;
  status: InquiryStatus;
  createdAt: number;
};

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

/** Every lead, newest first, for the admin inbox. Service role, like the reads
 *  in the order store. */
export async function listInquiries(): Promise<Inquiry[]> {
  const { data, error } = await supabaseAdmin()
    .from("partner_inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load inquiries: ${error.message}`);

  return (data ?? []).map((r) => ({
    id: r.id,
    kind: r.kind,
    name: r.name,
    email: r.email,
    phone: r.phone,
    message: r.message,
    preferredArea: r.preferred_area,
    timeline: r.timeline,
    eventType: r.event_type,
    eventDate: r.event_date,
    venue: r.venue,
    guestCount: r.guest_count,
    status: r.status,
    createdAt: Date.parse(r.created_at),
  }));
}

/** Move a lead through triage. */
export async function setInquiryStatus(id: string, status: InquiryStatus): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("partner_inquiries")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(`Could not update the inquiry: ${error.message}`);
}
