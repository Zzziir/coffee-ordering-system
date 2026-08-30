-- Craffé — franchise & event-cart inquiries.
--
-- Leads from the "work with Craffé" section on the contact page. Two kinds
-- share one table because they are the same shape of thing — someone reaching
-- out to do business — and differ only in a few fields:
--   franchise a prospect who wants to open their own Craffé.
--   event     someone booking a coffee cart for a wedding, debut, etc.
--
-- Writes come from a server action on the service role (like the order store),
-- so a public visitor never touches this table directly. RLS is enabled with
-- no policies: the anon and authenticated roles get nothing, the service role
-- bypasses it. Staff-facing reads can be added as a policy when an admin inbox
-- is built; for now the row is the durable record behind the (stubbed) email.

create table partner_inquiries (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('franchise', 'event')),

  -- Always collected.
  name          text not null,
  email         text not null,
  phone         text,
  message       text,

  -- Franchise only (null for an event lead).
  preferred_area text,
  timeline       text,

  -- Event only (null for a franchise lead).
  event_type    text,
  event_date    date,
  venue         text,
  guest_count   integer check (guest_count is null or guest_count >= 0),

  -- Simple triage state for a future admin inbox.
  status        text not null default 'new'
                  check (status in ('new', 'contacted', 'closed')),
  created_at    timestamptz not null default now()
);

-- Newest first is the only way this is ever listed.
create index partner_inquiries_created_at_idx
  on partner_inquiries (created_at desc);

alter table partner_inquiries enable row level security;
