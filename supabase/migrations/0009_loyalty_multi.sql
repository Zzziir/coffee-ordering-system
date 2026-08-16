-- Craffé — multiple free drinks per order.
--
-- 0008 comped a single drink per order, so the redeemed-reward count could be
-- inferred as "one per order with a discount". An order can now redeem several
-- free drinks (one per reward the customer holds), and across different drinks
-- and quantities, so the peso discount no longer implies how many rewards were
-- spent. reward_qty records that count directly; the derived balance subtracts
-- it (see lib/loyalty).

alter table orders
  add column reward_qty integer not null default 0
    check (reward_qty >= 0);

-- Backfill: every existing redemption spent exactly one reward under 0008.
update orders set reward_qty = 1 where reward_discount > 0;

/* ------------------------------------------------------------------ */
/* create_order records how many rewards were spent                    */
/* ------------------------------------------------------------------ */

drop function create_order(
  text, text, order_channel, text, text, text, payment_method, boolean, jsonb, uuid, integer
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
  p_reward_qty      integer default 0
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
    customer_id, reward_discount, reward_qty
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
    v_discount,
    greatest(coalesce(p_reward_qty, 0), 0)
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

revoke execute on function create_order(
  text, text, order_channel, text, text, text, payment_method, boolean, jsonb, uuid, integer, integer
) from anon, authenticated;
