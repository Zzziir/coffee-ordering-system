-- Craffé — atomic order writes.
--
-- An order is three tables: the header, its lines, and the first audit event.
-- PostgREST cannot span them in one transaction, and a half-written order is a
-- real failure on the floor — a pickup code on the barista's board with no
-- drinks under it. So the whole write is one function call, one transaction.

create function create_order(
  p_branch         text,
  p_code_prefix    text,
  p_channel        order_channel,
  p_table_number   text,
  p_customer_name  text,
  p_customer_phone text,
  p_payment_method payment_method,
  p_paid           boolean,
  p_lines          jsonb
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

  -- Atomic per branch, so two tills never mint the same code.
  v_seq := next_order_number(p_branch);

  insert into orders (
    branch_id, code, channel, table_number,
    customer_name, customer_phone, subtotal, payment_method, paid
  ) values (
    p_branch,
    p_code_prefix || lpad((v_seq % 100)::text, 2, '0'),
    p_channel,
    p_table_number,
    p_customer_name,
    p_customer_phone,
    v_subtotal,
    p_payment_method,
    p_paid
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

-- Advancing an order: the row and its audit trail move together, or not at all.
-- `p_staff_name` is denormalised into the event so the record survives the
-- staff row being deleted.
create function advance_order(
  p_order      uuid,
  p_status     order_status,
  p_staff      uuid,
  p_staff_name text
)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_found boolean;
begin
  update orders
     set status = p_status,
         -- Cash settles at pickup; everything else was paid up front.
         paid = paid or (p_status = 'completed' and payment_method = 'cash')
   where id = p_order
  returning true into v_found;

  if v_found is null then
    return false;
  end if;

  insert into order_events (order_id, status, staff_id, staff_name)
  values (p_order, p_status, p_staff, p_staff_name);

  return true;
end;
$$;

/* ------------------------------------------------------------------ */
/* Who may call these                                                  */
/* ------------------------------------------------------------------ */

-- PostgREST exposes every public function to the anon role by default. These
-- two write orders and burn the pickup-code counter, so they belong to the
-- service role only — the server routes that already enforce branch scope in
-- app code. next_order_number is locked down for the same reason: with the anon
-- key alone, anyone could run a branch's codes forward until they wrapped.
revoke execute on function create_order(
  text, text, order_channel, text, text, text, payment_method, boolean, jsonb
) from anon, authenticated;

revoke execute on function advance_order(uuid, order_status, uuid, text)
  from anon, authenticated;

revoke execute on function next_order_number(text) from anon, authenticated;
