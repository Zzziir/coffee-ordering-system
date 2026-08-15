-- Craffé — loyalty redemption.
--
-- The stamp card is "10 stamps, 1 free drink". A signed-in customer's stamp
-- balance is derived, never stored: it is the drinks on their paid orders, plus
-- a seed carried over from any guest ordering they did before signing up, minus
-- the free drinks they have already taken. Two small additions make that whole:
--
--   profiles.loyalty_seed   stamps a guest earned on-device and kept when they
--                           made an account (see /api/rewards). Additive credit.
--   orders.reward_discount  pesos comped on an order because a free drink was
--                           redeemed on it. A row with reward_discount > 0 is one
--                           redemption; that is how the derived balance is spent.
--
-- Nothing here holds a mutable "free drinks" counter — the balance is recomputed
-- from these facts every time (see lib/loyalty), so it can never drift.

alter table profiles
  add column loyalty_seed integer not null default 0
    check (loyalty_seed >= 0);

alter table orders
  add column reward_discount integer not null default 0
    check (reward_discount >= 0);

/* ------------------------------------------------------------------ */
/* create_order applies the reward                                     */
/* ------------------------------------------------------------------ */

-- Recreated (like 0004) to take a trailing p_reward_discount. It defaults 0, so
-- an order with no reward redeemed is just the call without it. The discount is
-- clamped to the order's gross so a subtotal can never go negative, and the
-- amount actually applied is what lands in reward_discount.
drop function create_order(
  text, text, order_channel, text, text, text, payment_method, boolean, jsonb, uuid
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
  p_reward_discount integer default 0
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
    customer_id, reward_discount
  ) values (
    p_branch,
    p_code_prefix || lpad((v_seq % 100)::text, 2, '0'),
    p_channel,
    p_table_number,
    p_customer_name,
    p_customer_phone,
    v_gross - v_discount,
    p_payment_method,
    p_paid,
    p_customer_id,
    v_discount
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

-- Same lockdown as 0002/0004: order writes are the server's job, service role only.
revoke execute on function create_order(
  text, text, order_channel, text, text, text, payment_method, boolean, jsonb, uuid, integer
) from anon, authenticated;
