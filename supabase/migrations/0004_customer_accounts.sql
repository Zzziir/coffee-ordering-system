-- Craffé — customer accounts.
--
-- Two kinds of person now hold a Supabase Auth credential:
--   staff     the roster at the till (0001) — baristas, managers, owners.
--   customers regular guests who sign up to keep their order history and their
--             loyalty stickers. Their profile lives here.
--
-- Both key their row to auth.users by id, and an auth user is one or the other:
-- staff are created by hand, customers sign themselves up. The signup carries
-- the profile fields as user metadata, and a trigger lands them in `profiles`
-- the moment the auth row is written — so it works whether or not email
-- confirmation is switched on.

/* ------------------------------------------------------------------ */
/* Profiles                                                            */
/* ------------------------------------------------------------------ */

-- email is duplicated from auth.users (like staff.email) so a profile read
-- needs no join into the auth schema. age is a plain number, not a birthdate:
-- it's "just for funsies" alongside the favourite flavour, not something we
-- reason about.
create table profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  first_name      text not null,
  last_name       text not null,
  age             smallint check (age is null or (age >= 0 and age <= 120)),
  favorite_flavor text,
  phone           text,
  email           text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger profiles_touch_updated_at
  before update on profiles
  for each row execute function touch_updated_at();

-- Land a profile the instant a customer signs up. Gated on the signup carrying
-- a first_name in its metadata, so hand-created staff accounts (which don't)
-- never get a stray profile row. SECURITY DEFINER: the trigger writes `profiles`
-- while running as the auth machinery inserting into auth.users.
create function handle_new_customer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.raw_user_meta_data ? 'first_name' then
    insert into profiles (id, first_name, last_name, age, favorite_flavor, phone, email)
    values (
      new.id,
      new.raw_user_meta_data->>'first_name',
      coalesce(new.raw_user_meta_data->>'last_name', ''),
      nullif(new.raw_user_meta_data->>'age', '')::smallint,
      nullif(new.raw_user_meta_data->>'favorite_flavor', ''),
      nullif(new.raw_user_meta_data->>'phone', ''),
      new.email
    );
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_customer();

-- Only the trigger ever runs this; PostgREST would otherwise expose it as an
-- RPC to anyone with the anon key. It fires as the definer, so keep it off the
-- public API entirely.
revoke execute on function handle_new_customer() from anon, authenticated;

/* ------------------------------------------------------------------ */
/* Orders belong to a customer (optional)                              */
/* ------------------------------------------------------------------ */

-- Guest checkout stays: an anonymous order leaves customer_id null. A signed-in
-- customer's order carries their id so it shows up in their history and feeds
-- their loyalty count. on delete set null keeps the sale on the books even if
-- the account is later removed.
alter table orders
  add column customer_id uuid references auth.users (id) on delete set null;

create index orders_customer_idx
  on orders (customer_id, created_at desc)
  where customer_id is not null;

/* ------------------------------------------------------------------ */
/* create_order learns about customers                                 */
/* ------------------------------------------------------------------ */

-- Recreated (not replaced) to take the new trailing p_customer_id. It defaults
-- null so a guest order is just the call without it.
drop function create_order(
  text, text, order_channel, text, text, text, payment_method, boolean, jsonb
);

create function create_order(
  p_branch         text,
  p_code_prefix    text,
  p_channel        order_channel,
  p_table_number   text,
  p_customer_name  text,
  p_customer_phone text,
  p_payment_method payment_method,
  p_paid           boolean,
  p_lines          jsonb,
  p_customer_id    uuid default null
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_order_id uuid;
  v_seq      integer;
  v_subtotal integer;
begin
  if p_lines is null or jsonb_array_length(p_lines) = 0 then
    raise exception 'an order needs at least one line';
  end if;

  select coalesce(sum((line->>'lineTotal')::integer), 0)
    into v_subtotal
    from jsonb_array_elements(p_lines) as line;

  v_seq := next_order_number(p_branch);

  insert into orders (
    branch_id, code, channel, table_number,
    customer_name, customer_phone, subtotal, payment_method, paid, customer_id
  ) values (
    p_branch,
    p_code_prefix || lpad((v_seq % 100)::text, 2, '0'),
    p_channel,
    p_table_number,
    p_customer_name,
    p_customer_phone,
    v_subtotal,
    p_payment_method,
    p_paid,
    p_customer_id
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

  return v_order_id;
end;
$$;

-- Same lockdown as 0002: order writes are the server's job, on the service role.
revoke execute on function create_order(
  text, text, order_channel, text, text, text, payment_method, boolean, jsonb, uuid
) from anon, authenticated;

/* ------------------------------------------------------------------ */
/* Row level security                                                  */
/* ------------------------------------------------------------------ */

alter table profiles enable row level security;

-- A customer reads and edits only their own profile. There is no cross-customer
-- read: nobody, staff included, browses the guest list through this table.
create policy profiles_read_self
  on profiles for select
  to authenticated
  using (id = auth.uid());

create policy profiles_update_self
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
