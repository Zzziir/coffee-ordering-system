-- Craffé — per-branch availability.
--
-- Until now menu_items.available was one brand-wide sold-out switch: mark a drink
-- off and it left both branches at once. But a branch that runs out of oat milk
-- or a pastry needs to switch only its own board off, so sold-out moves per
-- branch here. menu_items.available stays as the owner's master switch (an item
-- retired everywhere); an item is orderable at a branch when the master is on and
-- there is no sold-out row for that branch.

create table menu_item_unavailable (
  item_id   text not null references menu_items (id) on delete cascade,
  branch_id text not null references branches (id)   on delete cascade,
  primary key (item_id, branch_id)
);

alter table menu_item_unavailable enable row level security;

-- Availability isn't a secret; anyone may read which branch is out of what.
create policy menu_item_unavailable_read
  on menu_item_unavailable for select using (true);

-- An admin switches an item off, but a manager only for their own branch; owners
-- for any. SECURITY DEFINER for the same reason as is_staff_admin in 0005: a
-- policy that reads staff would otherwise recurse.
create function is_staff_admin_for_branch(p_branch text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from staff
     where id = auth.uid()
       and role in ('owner', 'manager')
       and (role = 'owner' or branch_id = p_branch)
  );
$$;

create policy menu_item_unavailable_admin_write
  on menu_item_unavailable for all to authenticated
  using (is_staff_admin_for_branch(branch_id))
  with check (is_staff_admin_for_branch(branch_id));
