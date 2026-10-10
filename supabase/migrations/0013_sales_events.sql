-- Craffé — bazaars and events.
--
-- Craffé sells from a booth at bazaars as well as from its two stores. A booth
-- sale is still an order (same menu, same lines), so it lives in `orders`; what
-- it needs is somewhere to say *which* bazaar it belongs to, and a place to
-- record the day's cash float so the till can be reconciled afterwards.
--
--   sales_events     one row per bazaar / pop-up
--   orders.event_id  nullable; null is a normal store sale
--
-- Named sales_events, not events: `order_events` is already the per-order audit
-- trail and the two must not be confused.

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

create type sales_event_status as enum ('active', 'closed');

-- branch_id is the store that staffs and stocks the booth. An order must belong
-- to a branch (it scopes the pickup-code counter), so an event names one. Booth
-- sales are still reported apart from that store's own takings.
--
-- Dates are plain calendar days in Manila. Either may be null: an event with
-- only a start date is a single day. Overlapping events are allowed.
create table sales_events (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (length(trim(name)) > 0),
  venue        text,
  city         text,
  organizer    text,
  branch_id    text not null references branches (id),
  starts_on    date,
  ends_on      date,
  opening_cash integer check (opening_cash is null or opening_cash >= 0),
  cash_note    text,
  closing_cash integer check (closing_cash is null or closing_cash >= 0),
  status       sales_event_status not null default 'active',
  closed_at    timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint sales_events_dates_in_order
    check (starts_on is null or ends_on is null or ends_on >= starts_on)
);

create trigger sales_events_touch_updated_at
  before update on sales_events
  for each row execute function touch_updated_at();

create index sales_events_dates_idx on sales_events (starts_on desc nulls last);

alter table sales_events enable row level security;

-- Back office only. The app reads and writes on the service role behind the
-- admin gate; this policy is the same rule stated in the database.
create policy sales_events_admin_all
  on sales_events for all to authenticated
  using (is_staff_admin()) with check (is_staff_admin());

/* ------------------------------------------------------------------ */
/* Orders point at their event                                         */
/* ------------------------------------------------------------------ */

-- Deleting an event must never delete sales: they fall back to untagged.
alter table orders
  add column event_id uuid references sales_events (id) on delete set null;

create index orders_event_idx on orders (event_id) where event_id is not null;

-- The sales report reads by date range across every branch.
create index orders_created_at_idx on orders (created_at desc);

/* ------------------------------------------------------------------ */
/* create_order stamps the event                                       */
/* ------------------------------------------------------------------ */

-- Recreated to take a trailing p_event_id. It defaults to null, so every
-- existing caller is unchanged. A booth sale is handed over as it is rung up:
-- it is born completed and paid, so it never appears on a store's barista
-- board, and its audit trail records both steps.
drop function create_order(
  text, text, order_channel, text, text, text, payment_method, boolean, jsonb, uuid, integer, integer
);

create function create_order(
  p_branch          text,
  p_code_prefix     text,
  p_channel         order_channel,
  p_table_number    text,
  p_customer_name   text,
  p_customer_phone  text,
  p_payment_method  payment_method,
  p_paid            boolean,
  p_lines           jsonb,
  p_customer_id     uuid    default null,
  p_reward_discount integer default 0,
  p_reward_qty      integer default 0,
  p_event_id        uuid    default null
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_order_id uuid;
  v_seq      integer;
  v_gross    integer;
  v_discount integer;
begin
  if p_lines is null or jsonb_array_length(p_lines) = 0 then
    raise exception 'an order needs at least one line';
  end if;

  select coalesce(sum((line->>'lineTotal')::integer), 0)
    into v_gross
    from jsonb_array_elements(p_lines) as line;

  -- Never comp more than the order is worth, never a negative discount.
  v_discount := least(greatest(coalesce(p_reward_discount, 0), 0), v_gross);

  v_seq := next_order_number(p_branch);

  insert into orders (
    branch_id, code, channel, table_number,
    customer_name, customer_phone, subtotal, payment_method, paid,
    customer_id, reward_discount, reward_qty, event_id, status
  ) values (
    p_branch,
    p_code_prefix || lpad((v_seq % 100)::text, 2, '0'),
    p_channel,
    p_table_number,
    p_customer_name,
    p_customer_phone,
    v_gross - v_discount,
    p_payment_method,
    -- A booth sale is settled on the spot, whatever the tender.
    p_paid or p_event_id is not null,
    p_customer_id,
    v_discount,
    greatest(coalesce(p_reward_qty, 0), 0),
    p_event_id,
    case when p_event_id is null then 'received' else 'completed' end::order_status
  )
  returning id into v_order_id;

  insert into order_lines (
    order_id, position, item_id, name, base_price, qty, groups, line_total, note
  )
  select v_order_id,
         ord - 1,
         line->>'itemId',
         line->>'name',
         (line->>'basePrice')::integer,
         (line->>'qty')::integer,
         coalesce(line->'groups', '[]'::jsonb),
         (line->>'lineTotal')::integer,
         nullif(line->>'note', '')
    from jsonb_array_elements(p_lines) with ordinality as t(line, ord);

  insert into order_events (order_id, status) values (v_order_id, 'received');
  if p_event_id is not null then
    insert into order_events (order_id, status) values (v_order_id, 'completed');
  end if;

  return v_order_id;
end;
$$;

revoke execute on function create_order(
  text, text, order_channel, text, text, text, payment_method, boolean, jsonb, uuid, integer, integer, uuid
) from anon, authenticated;
