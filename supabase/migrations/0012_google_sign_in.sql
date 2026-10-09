-- Craffé — sign in with Google.
--
-- A customer who arrives through Google never fills in the sign-up form, so
-- their auth row carries no `first_name`. What Google does send is a display
-- name (`full_name`), and that is enough to open a profile: the customer can
-- fill in the rest from the account page.
--
-- The gate still keeps staff out. A hand-created staff account has neither
-- field, so it gets no profile row, exactly as before (see 0004).

create or replace function handle_new_customer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  google_name text := btrim(coalesce(new.raw_user_meta_data->>'full_name', ''));
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
  elsif google_name <> '' then
    -- Google sends one display name. The last word is taken as the surname and
    -- everything before it as the given name, which keeps two-word given names
    -- ("Maria Clara Santos") together. A single word is all given name.
    insert into profiles (id, first_name, last_name, email)
    values (
      new.id,
      case
        when google_name ~ '\s' then regexp_replace(google_name, '\s+\S+$', '')
        else google_name
      end,
      case
        when google_name ~ '\s' then substring(google_name from '\S+$')
        else ''
      end,
      new.email
    );
  end if;
  return new;
end;
$$;
