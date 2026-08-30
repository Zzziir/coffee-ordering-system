import type { InquiryInput } from "./inquiries";

/**
 * Email seam for partner inquiries.
 *
 * The lead is already saved to `partner_inquiries` by the time this runs, so a
 * failure here must never lose it — this only alerts the team that one landed.
 * Today it just logs; the row in Supabase is the real record.
 *
 * RESEND HOOK (future): send to `process.env.CRAFFE_INQUIRY_INBOX` via Resend
 * (see the same hook in store.ts). Wrap the send in try/catch and swallow the
 * error after logging, so a provider outage can't break a submission that has
 * already been persisted.
 */
export async function notifyInquiry(input: InquiryInput): Promise<void> {
  const inbox = process.env.CRAFFE_INQUIRY_INBOX;

  if (!inbox) {
    console.info(
      `[inquiry] ${input.kind} lead from ${input.name} <${input.email}> ` +
        `— set CRAFFE_INQUIRY_INBOX and wire Resend to email these.`,
    );
    return;
  }

  // Provider not wired yet. The lead is safe in the database regardless.
  console.info(`[inquiry] ${input.kind} lead from ${input.name} would email ${inbox}.`);
}
