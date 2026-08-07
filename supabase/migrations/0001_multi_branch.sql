-- Craffé — multi-branch schema.
--
-- Split of responsibility:
--   src/lib/branches.ts  owns branch *presentation* config (hours, copy, logo,
--                        channels, payment methods). Changes with a deploy.
--   this database        owns branch *identity* so orders and staff can FK to
--                        it, plus the atomic per-branch pickup-code counter.
-- Adding a branch = a row here + a record in branches.ts.

create extension if not exists "pgcrypto";

/* ------------------------------------------------------------------ */
/* Vocabulary                                                          */
/* ------------------------------------------------------------------ */

create type order_status   as enum ('received', 'preparing', 'ready', 'completed');
create type order_channel  as enum ('dinein', 'onsite', 'pickup');
create type payment_method as enum ('gcash', 'maya', 'card', 'cash');
create type staff_role     as enum ('barista', 'manager', 'owner');

/* ------------------------------------------------------------------ */
/* Branches                                                            */
/* ------------------------------------------------------------------ */

create table branches (
  id   text primary key,
  name text not null
);

insert into branches (id, name) values
  ('east-rembo', 'Craffé East Rembo'),
  ('mycc',       'Craffé by MYCC');

/* ------------------------------------------------------------------ */
/* Staff                                                               */
/* ------------------------------------------------------------------ */

-- One row per barista, keyed to their Supabase Auth user.
-- branch_id null + role 'owner' = sees every branch.
create table staff (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  name       text not null,
  branch_id  text references branches (id),
  role       staff_role not null default 'barista',
  created_at timestamptz not null default now(),
  constraint staff_branch_required_unless_owner
    check (role = 'owner' or branch_id is not null)
);

create index staff_branch_idx on staff (branch_id);

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

-- Money is whole Philippine pesos. The menu has no centavo prices, so integers
-- avoid float rounding entirely.
create table orders (
  id             uuid primary key default gen_random_uuid(),
  branch_id      text not null references branches (id),
  code           text not null,
  channel        order_channel not null,
  table_number   text,
  customer_name  text not null,
  customer_phone text,
  subtotal       integer not null check (subtotal >= 0),
  status         order_status not null default 'received',
  payment_method payment_method not null,
  paid           boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint table_number_only_for_dinein
    check (channel = 'dinein' or table_number is null)
);

create index orders_branch_active_idx
  on orders (branch_id, created_at)
  where status <> 'completed';

create table order_lines (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders (id) on delete cascade,
  position   integer not null,
  item_id    text not null,
  name       text not null,
  base_price integer not null check (base_price >= 0),
  qty        integer not null check (qty > 0 and qty <= 20),
  -- Selected add-on groups, frozen at order time so a later menu edit can
  -- never rewrite what someone already bought.
  groups     jsonb not null default '[]'::jsonb,
  line_total integer not null check (line_total >= 0),
  note       text,
  unique (order_id, position)
);

create index order_lines_order_idx on order_lines (order_id);

-- The audit trail: who advanced this order, and when.
-- staff_name is denormalised so the record survives the staff row being deleted.
create table order_events (
  id         bigserial primary key,
  order_id   uuid not null references orders (id) on delete cascade,
  status     order_status not null,
  at         timestamptz not null default now(),
  staff_id   uuid references staff (id) on delete set null,
  staff_name text
);

create index order_events_order_idx on order_events (order_id, at);

/* ------------------------------------------------------------------ */
/* Pickup codes                                                        */
/* ------------------------------------------------------------------ */

-- Each branch counts independently so East Rembo and MYCC never call the same
-- code on the same afternoon. The DB owns the number; the app prefixes it with
-- the branch letter from branches.ts (R14, M14).
create table branch_code_seq (
  branch_id text primary key references branches (id) on delete cascade,
  seq       integer not null default 13
);

insert into branch_code_seq (branch_id)
  select id from branches;

create function next_order_number(p_branch text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seq integer;
begin
  -- Single atomic statement: concurrent orders can't collide on a code.
  update branch_code_seq
     set seq = seq + 1
   where branch_id = p_branch
  returning seq into v_seq;

  if v_seq is null then
    raise exception 'unknown branch %', p_branch;
  end if;

  return v_seq;
end;
$$;

/* ------------------------------------------------------------------ */
/* updated_at                                                          */
/* ------------------------------------------------------------------ */

create function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_touch_updated_at
  before update on orders
  for each row execute function touch_updated_at();

/* ------------------------------------------------------------------ */
/* Row level security                                                  */
/* ------------------------------------------------------------------ */

alter table branches        enable row level security;
alter table staff           enable row level security;
alter table orders          enable row level security;
alter table order_lines     enable row level security;
alter table order_events    enable row level security;
alter table branch_code_seq enable row level security;

-- Branch list is public (the picker and Contact page read it).
create policy branches_readable_by_all
  on branches for select
  using (true);

-- Is the caller an owner? Must be SECURITY DEFINER: a policy ON staff that
-- reads staff directly recurses, and Postgres aborts with "infinite recursion
-- detected in policy for relation staff". Running as the definer bypasses RLS
-- and breaks the cycle.
create function is_staff_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from staff where id = auth.uid() and role = 'owner'
  );
$$;

-- A signed-in barista can read their own staff row; owners read everyone.
create policy staff_read_self
  on staff for select
  to authenticated
  using (id = auth.uid() or is_staff_owner());

-- Which branches the current user may act on. Same SECURITY DEFINER reasoning:
-- these policies live on orders but read staff, and staff has its own policies.
create function staff_may_access(p_branch text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from staff
     where id = auth.uid()
       and (role = 'owner' or branch_id = p_branch)
  );
$$;

create policy orders_staff_read
  on orders for select
  to authenticated
  using (staff_may_access(branch_id));

create policy orders_staff_update
  on orders for update
  to authenticated
  using (staff_may_access(branch_id))
  with check (staff_may_access(branch_id));

create policy order_lines_staff_read
  on order_lines for select
  to authenticated
  using (exists (
    select 1 from orders o
     where o.id = order_lines.order_id
       and staff_may_access(o.branch_id)
  ));

create policy order_events_staff_read
  on order_events for select
  to authenticated
  using (exists (
    select 1 from orders o
     where o.id = order_events.order_id
       and staff_may_access(o.branch_id)
  ));

create policy order_events_staff_insert
  on order_events for insert
  to authenticated
  with check (exists (
    select 1 from orders o
     where o.id = order_events.order_id
       and staff_may_access(o.branch_id)
  ));

-- NOTE — deliberately NO anon select policy on orders.
--
-- A customer is anonymous and holds only their own order id. RLS can't express
-- "the one row you asked for": a `using (true)` select policy would let anyone
-- with the anon key dump every order in the shop, names and phone numbers
-- included. So customers never read this table directly.
--
-- Placing an order  -> POST /api/orders (server, service role)
-- Reading an order  -> GET /api/orders/[id] (server, service role)
-- Live status       -> Realtime *broadcast* on a per-order topic, not
--                      postgres_changes. Subscribing needs the exact order id,
--                      which is the same unguessable-link model the status page
--                      already relies on — and unlike a table policy it grants
--                      no way to enumerate other orders. Added in a follow-up
--                      migration once the broadcast trigger is verified.
--
-- Staff are authenticated and branch-scoped, so they use postgres_changes
-- against the policies above.
