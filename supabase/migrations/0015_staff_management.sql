-- Team management: admins add, deactivate and reactivate staff from /admin/team.
--
-- Deactivating keeps the row (and the auth user) so past order events still
-- name who handled them, and the account can be switched back on. The app bans
-- the auth user too, so a deactivated barista can't sign in; this column is
-- what every access check reads, so an already signed-in session loses access
-- on its next request rather than when its token expires.

alter table staff add column deactivated_at timestamptz;

-- Every helper that reads the roster now ignores deactivated rows. Same
-- signatures and SECURITY DEFINER reasoning as where each was first defined
-- (0001, 0005, 0007); only the `deactivated_at is null` filter is new.

create or replace function is_staff_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from staff
     where id = auth.uid() and role = 'owner' and deactivated_at is null
  );
$$;

create or replace function staff_may_access(p_branch text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from staff
     where id = auth.uid()
       and deactivated_at is null
       and (role = 'owner' or branch_id = p_branch)
  );
$$;

create or replace function is_staff_admin()
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
       and deactivated_at is null
  );
$$;

create or replace function is_staff_admin_for_branch(p_branch text)
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
       and deactivated_at is null
       and (role = 'owner' or branch_id = p_branch)
  );
$$;
