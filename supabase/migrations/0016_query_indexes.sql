/* ------------------------------------------------------------------ */
/* Indexes for the list reads that grow                                */
/* ------------------------------------------------------------------ */

-- Indexes only where a table grows with use. The menu tables and the staff
-- roster stay a few dozen rows, are read whole (the menu through a five-minute
-- cache), and Postgres scans them faster than it would walk an index.

-- A branch's full order history, newest first (listAllOrders). The same
-- branch_id test runs in staff_may_access for every staff read and realtime
-- frame. orders_branch_active_idx only covers orders still in progress.
create index if not exists orders_branch_created_idx
  on orders (branch_id, created_at desc);

-- The admin customer list, newest sign-up first (listProfiles).
create index if not exists profiles_created_at_idx
  on profiles (created_at desc);

-- The events list sorts by start date, then by when it was entered, so two
-- events on the same day keep a stable order. Widens sales_events_dates_idx
-- from 0013 to cover both keys.
drop index if exists sales_events_dates_idx;
create index sales_events_dates_idx
  on sales_events (starts_on desc nulls last, created_at desc);
