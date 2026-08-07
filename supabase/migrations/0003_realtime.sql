-- Craffé — live order updates.
--
-- Two audiences, two transports, for the reason set out at the foot of
-- 0001_multi_branch.sql:
--
--   Staff     authenticated and branch-scoped, so they listen to
--             `postgres_changes` on `orders` and RLS does the filtering.
--
--   Customers anonymous, holding only their own order id. There is no anon
--             select policy on `orders` and there must not be one, so instead
--             every change is broadcast to a topic named after the order.
--             Subscribing needs the exact uuid — the same unguessable-link
--             model the status page already relies on — and unlike a table
--             policy it grants no way to enumerate anything.
--
-- Neither payload carries customer data. Both are a nudge saying "this order
-- moved"; the client then reads the order back through the server route that
-- already decides what it may see.

/* ------------------------------------------------------------------ */
/* Staff: postgres_changes                                             */
/* ------------------------------------------------------------------ */

alter publication supabase_realtime add table orders;

/* ------------------------------------------------------------------ */
/* Customers: one broadcast topic per order                            */
/* ------------------------------------------------------------------ */

create function broadcast_order_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform realtime.send(
    jsonb_build_object('id', new.id, 'status', new.status),
    'change',
    'order:' || new.id::text,
    -- Public topic. The topic name embeds the order's uuid, so knowing it is
    -- the credential; the payload is deliberately free of anything private.
    false
  );
  return null;
end;
$$;

create trigger orders_broadcast_change
  after insert or update on orders
  for each row execute function broadcast_order_change();
