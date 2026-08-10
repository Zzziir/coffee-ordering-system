-- Craffé — the menu moves into the database.
--
-- Until now the catalog lived in src/lib/menu.ts and shipped with a deploy. It
-- moves here so an owner or manager can add drinks, retune prices, swap photos
-- and mark something sold out from the admin screen, without a release.
--
-- Shape mirrors the old module exactly, so the app's types don't change:
--   categories      the sections, in display order, each a drink or food
--   add-on groups   size / milk / extras, shared across categories
--   add-ons         the options inside a group, with their surcharge
--   category groups  which add-on groups a category offers, in order
--   items           the drinks and food, priced, tagged, available or not
--
-- Prices are whole pesos (integer), as everywhere else. Item ids stay the same
-- text slugs, so historical order_lines.item_id still points at the right drink.

/* ------------------------------------------------------------------ */
/* Tables                                                              */
/* ------------------------------------------------------------------ */

create table menu_categories (
  id       text primary key,
  name     text not null,
  note     text,
  -- Drives loyalty: only a 'drink' earns a sticker (see drinkStickers).
  kind     text not null check (kind in ('drink', 'food')),
  position integer not null
);

create table menu_add_on_groups (
  id                text primary key,
  name              text not null,
  type              text not null check (type in ('single', 'multi')),
  -- the option pre-selected for a single-choice group (size, milk); null for multi
  default_option_id text
);

create table menu_add_ons (
  id       text primary key,
  group_id text not null references menu_add_on_groups (id) on delete cascade,
  name     text not null,
  price    integer not null check (price >= 0),
  position integer not null
);

create index menu_add_ons_group_idx on menu_add_ons (group_id, position);

-- Add-on groups attach at the category level; every item in the category offers
-- them. Ordered, so "Size" comes before "Milk" before "Make it yours".
create table menu_category_groups (
  category_id text not null references menu_categories (id) on delete cascade,
  group_id    text not null references menu_add_on_groups (id) on delete cascade,
  position    integer not null,
  primary key (category_id, group_id)
);

create table menu_items (
  id          text primary key,
  name        text not null,
  price       integer not null check (price >= 0),
  category_id text not null references menu_categories (id),
  signature   boolean not null default false,
  description text,
  image       text,
  -- Diet tags (coffee, dairy, contains-nuts, ...). A plain array: the set is
  -- small and fixed, and the app reads them as a list.
  tags        text[] not null default '{}',
  -- The admin availability switch. Unavailable items stay in the catalog (and
  -- in past orders) but drop out of the customer menu.
  available   boolean not null default true,
  position    integer not null
);

create index menu_items_category_idx on menu_items (category_id, position);

/* ------------------------------------------------------------------ */
/* Who may edit the menu                                               */
/* ------------------------------------------------------------------ */

-- Owners and managers are the admins; the menu is one brand-wide catalog, so
-- there's no branch scope here. SECURITY DEFINER for the same reason as
-- is_staff_owner in 0001: a policy that reads staff would otherwise recurse.
create function is_staff_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from staff
     where id = auth.uid() and role in ('owner', 'manager')
  );
$$;

/* ------------------------------------------------------------------ */
/* Row level security                                                  */
/* ------------------------------------------------------------------ */

alter table menu_categories      enable row level security;
alter table menu_add_on_groups   enable row level security;
alter table menu_add_ons         enable row level security;
alter table menu_category_groups enable row level security;
alter table menu_items           enable row level security;

-- The catalog is public information — anyone may read it. Nothing here is
-- sensitive, and availability isn't a secret.
create policy menu_categories_read      on menu_categories      for select using (true);
create policy menu_add_on_groups_read   on menu_add_on_groups   for select using (true);
create policy menu_add_ons_read         on menu_add_ons         for select using (true);
create policy menu_category_groups_read on menu_category_groups for select using (true);
create policy menu_items_read           on menu_items           for select using (true);

-- Only admins write. `for all` covers insert, update and delete; the same check
-- guards the row going in and the row already there.
create policy menu_categories_admin_write
  on menu_categories for all to authenticated
  using (is_staff_admin()) with check (is_staff_admin());
create policy menu_add_on_groups_admin_write
  on menu_add_on_groups for all to authenticated
  using (is_staff_admin()) with check (is_staff_admin());
create policy menu_add_ons_admin_write
  on menu_add_ons for all to authenticated
  using (is_staff_admin()) with check (is_staff_admin());
create policy menu_category_groups_admin_write
  on menu_category_groups for all to authenticated
  using (is_staff_admin()) with check (is_staff_admin());
create policy menu_items_admin_write
  on menu_items for all to authenticated
  using (is_staff_admin()) with check (is_staff_admin());

/* ------------------------------------------------------------------ */
/* Seed — transcribed from src/lib/menu.ts                              */
/* ------------------------------------------------------------------ */

insert into menu_categories (id, name, note, kind, position) values
  ('espresso', 'Espresso', '16oz · +₱20 upsize', 'drink', 0),
  ('non-coffee', 'Non-Coffee', '16oz · +₱20 upsize', 'drink', 1),
  ('frappe-coffee', 'Coffee Frappé', '20oz · +₱20 upsize', 'drink', 2),
  ('frappe-cream', 'Cream Frappé', '20oz · +₱20 upsize', 'drink', 3),
  ('thai-tea', 'Thai Tea', '16oz only', 'drink', 4),
  ('refreshers', 'Refreshers', 'Sparkling · 16oz', 'drink', 5),
  ('cookies', 'Dubai Chewy Cookies', null, 'food', 6),
  ('snacks', 'Snacks', null, 'food', 7),
  ('pastries', 'Pastries', null, 'food', 8),
  ('bottled', 'Bottled', 'Grab & go', 'drink', 9);

insert into menu_add_on_groups (id, name, type, default_option_id) values
  ('size-16', 'Size', 'single', 'size-16-reg'),
  ('size-20', 'Size', 'single', 'size-20-reg'),
  ('milk', 'Milk', 'single', 'milk-fresh'),
  ('espresso-extras', 'Make it yours', 'multi', null),
  ('frappe-extras', 'Make it yours', 'multi', null),
  ('sweetener', 'Make it yours', 'multi', null);

insert into menu_add_ons (id, group_id, name, price, position) values
  ('size-16-reg', 'size-16', '16oz', 0, 0),
  ('size-16-up', 'size-16', 'Upsize 22oz', 20, 1),
  ('size-20-reg', 'size-20', '20oz', 0, 0),
  ('size-20-up', 'size-20', 'Upsize 24oz', 20, 1),
  ('milk-fresh', 'milk', 'Fresh milk', 0, 0),
  ('milk-oat', 'milk', 'Oat milk', 40, 1),
  ('extra-shot', 'espresso-extras', 'Extra espresso shot', 30, 0),
  ('sea-salt-cream', 'espresso-extras', 'Sea salt cream', 30, 1),
  ('sweetener', 'espresso-extras', 'Sugar sweetener', 10, 2),
  ('whipped-cream', 'frappe-extras', 'Whipped cream', 30, 0),
  ('nata', 'frappe-extras', 'Nata de coco', 10, 1),
  ('sweetener-f', 'frappe-extras', 'Sugar sweetener', 10, 2),
  ('sweetener-s', 'sweetener', 'Sugar sweetener', 10, 0);

insert into menu_category_groups (category_id, group_id, position) values
  ('espresso', 'size-16', 0),
  ('espresso', 'milk', 1),
  ('espresso', 'espresso-extras', 2),
  ('non-coffee', 'size-16', 0),
  ('non-coffee', 'milk', 1),
  ('non-coffee', 'sweetener', 2),
  ('frappe-coffee', 'size-20', 0),
  ('frappe-coffee', 'frappe-extras', 1),
  ('frappe-cream', 'size-20', 0),
  ('frappe-cream', 'frappe-extras', 1),
  ('thai-tea', 'sweetener', 0),
  ('refreshers', 'size-16', 0);

insert into menu_items (id, name, price, category_id, signature, description, image, tags, position) values
  ('americano', 'Americano', 75, 'espresso', false, null, null, '{"coffee","caffeine-free"}', 0),
  ('craffeccino', 'Crafféccino', 80, 'espresso', false, null, null, '{"coffee","dairy"}', 1),
  ('cappuccino', 'Cappuccino', 100, 'espresso', false, null, null, '{"coffee","dairy","oat-available"}', 2),
  ('flat-white', 'Flat White', 100, 'espresso', false, null, null, '{"coffee","dairy","oat-available"}', 3),
  ('caramel-macchiato', 'Caramel Macchiato', 105, 'espresso', true, null, null, '{"coffee","dairy","oat-available"}', 4),
  ('mocha', 'Mocha', 105, 'espresso', false, null, null, '{"coffee","dairy","oat-available"}', 5),
  ('white-mocha', 'White Mocha', 105, 'espresso', false, null, null, '{"coffee","dairy","oat-available"}', 6),
  ('spanish-latte', 'Spanish Latte', 105, 'espresso', true, null, null, '{"coffee","dairy","oat-available"}', 7),
  ('vanilla-latte', 'Vanilla Latte', 105, 'espresso', false, null, null, '{"coffee","dairy","oat-available"}', 8),
  ('hazelnut-latte', 'Hazelnut Latte', 115, 'espresso', false, null, null, '{"coffee","dairy","oat-available","contains-nuts"}', 9),
  ('sea-salt-latte', 'Sea Salt Latte', 120, 'espresso', true, null, null, '{"coffee","dairy","oat-available"}', 10),
  ('hazelnut-mocha', 'Hazelnut Mocha', 120, 'espresso', true, null, null, '{"coffee","dairy","oat-available","contains-nuts"}', 11),
  ('macadamia-oat-latte', 'Macadamia Oat Latte', 130, 'espresso', false, null, null, '{"coffee","oat-available","contains-nuts"}', 12),
  ('irish-cream-oat-latte', 'Irish Cream Oat Latte', 130, 'espresso', false, null, null, '{"coffee","oat-available"}', 13),
  ('biscoff-latte', 'Biscoff Latte', 140, 'espresso', false, null, null, '{"coffee","dairy","oat-available"}', 14),
  ('biscoff-caramel-latte', 'Biscoff Caramel Latte', 150, 'espresso', true, null, null, '{"coffee","dairy","oat-available"}', 15),
  ('smores-latte', 'S''mores Latte', 150, 'espresso', false, null, null, '{"coffee","dairy","oat-available"}', 16),
  ('strawberry-milk', 'Strawberry Milk', 100, 'non-coffee', false, null, null, '{"caffeine-free","dairy","oat-available"}', 17),
  ('signature-chocolate', 'Signature Chocolate', 110, 'non-coffee', true, null, null, '{"caffeine-free","dairy","oat-available"}', 18),
  ('matcha-latte', 'Matcha Latte', 105, 'non-coffee', true, null, null, '{"dairy","oat-available"}', 19),
  ('chocolate-smores', 'Chocolate S''mores', 120, 'non-coffee', false, null, null, '{"caffeine-free","dairy","oat-available"}', 20),
  ('sea-salt-matcha', 'Sea Salt Matcha', 125, 'non-coffee', true, null, null, '{"dairy","oat-available"}', 21),
  ('strawberry-matcha', 'Strawberry Matcha', 125, 'non-coffee', false, null, null, '{"dairy","oat-available"}', 22),
  ('strawberry-caramel-mousse', 'Strawberry Caramel Mousse', 130, 'non-coffee', false, null, null, '{"caffeine-free","dairy"}', 23),
  ('creamy-biscoff', 'Creamy Biscoff', 130, 'non-coffee', false, null, null, '{"caffeine-free","dairy"}', 24),
  ('creamy-biscoff-caramel', 'Creamy Biscoff Caramel', 140, 'non-coffee', true, null, null, '{"caffeine-free","dairy"}', 25),
  ('java-chip-frappe', 'Java Chip Frappé', 150, 'frappe-coffee', true, null, null, '{"coffee","dairy"}', 26),
  ('caramel-frappe', 'Caramel Frappé', 150, 'frappe-coffee', false, null, null, '{"coffee","dairy"}', 27),
  ('mocha-frappe', 'Mocha Frappé', 150, 'frappe-coffee', false, null, null, '{"coffee","dairy"}', 28),
  ('white-mocha-frappe', 'White Mocha Frappé', 150, 'frappe-coffee', false, null, null, '{"coffee","dairy"}', 29),
  ('hazelnut-mocha-frappe', 'Hazelnut Mocha Frappé', 160, 'frappe-coffee', false, null, null, '{"coffee","dairy","contains-nuts"}', 30),
  ('biscoff-caramel-frappe', 'Biscoff Caramel Frappé', 170, 'frappe-coffee', true, null, null, '{"coffee","dairy"}', 31),
  ('signature-chocolate-frappe', 'Signature Chocolate Frappé', 130, 'frappe-cream', false, null, null, '{"caffeine-free","dairy"}', 32),
  ('strawberry-cream-frappe', 'Strawberry Cream Frappé', 130, 'frappe-cream', false, null, null, '{"caffeine-free","dairy"}', 33),
  ('cookies-and-cream-frappe', 'Cookies and Cream Frappé', 130, 'frappe-cream', false, null, null, '{"caffeine-free","dairy"}', 34),
  ('matcha-cream-frappe', 'Matcha Cream Frappé', 140, 'frappe-cream', false, null, null, '{"dairy"}', 35),
  ('crema-nutella-frappe', 'Crema Nutella Frappé', 150, 'frappe-cream', false, null, null, '{"caffeine-free","dairy","contains-nuts"}', 36),
  ('creamy-biscoff-frappe', 'Creamy Biscoff Frappé', 160, 'frappe-cream', true, null, null, '{"caffeine-free","dairy"}', 37),
  ('thai-tea', 'Thai Tea', 80, 'thai-tea', true, null, null, '{"caffeine-free"}', 38),
  ('thai-milk-tea', 'Thai Milk Tea', 90, 'thai-tea', false, null, null, '{"caffeine-free","dairy"}', 39),
  ('thai-lemon-tea', 'Thai Lemon Tea', 90, 'thai-tea', false, null, null, '{"caffeine-free","vegan-friendly"}', 40),
  ('refresher-blueberry', 'Blueberry', 80, 'refreshers', false, null, null, '{"caffeine-free","vegan-friendly"}', 41),
  ('refresher-strawberry', 'Strawberry', 80, 'refreshers', false, null, null, '{"caffeine-free","vegan-friendly"}', 42),
  ('refresher-green-apple', 'Green Apple', 80, 'refreshers', false, null, null, '{"caffeine-free","vegan-friendly"}', 43),
  ('refresher-lychee', 'Lychee', 80, 'refreshers', false, null, null, '{"caffeine-free","vegan-friendly"}', 44),
  ('cookie-pistachio', 'Pistachio Dubai Chewy Cookie', 95, 'cookies', true, 'Soft-baked, filled with creamy pistachio. Nutty and rich, perfect with your coffee.', null, '{"contains-nuts","dairy"}', 45),
  ('cookie-biscoff', 'Biscoff Dubai Chewy Cookie', 95, 'cookies', false, 'Chewy cookie with a crunchy cookie-butter center and sweet caramel notes.', null, '{"dairy"}', 46),
  ('cookie-nutella', 'Nutella Dubai Chewy Cookie', 95, 'cookies', false, 'Chewy and crunchy with a choco-hazelnut core. A café classic in every bite.', null, '{"dairy","contains-nuts"}', 47),
  ('fries', 'Fries', 60, 'snacks', false, null, null, '{}', 48),
  ('cheese-sticks', 'Cheese Sticks', 70, 'snacks', false, '5 pieces.', null, '{}', 49),
  ('french-toast', 'French Toast', 70, 'snacks', false, '2 pieces.', null, '{}', 50),
  ('grilled-cheese', 'Grilled Cheese', 120, 'snacks', false, 'Served with fries.', null, '{}', 51),
  ('chocolate-cake', 'Chocolate Cake', 40, 'pastries', false, null, null, '{"dairy"}', 52),
  ('banana-cake', 'Banana Cake', 40, 'pastries', false, null, null, '{"dairy"}', 53),
  ('choco-chips-brownie', 'Choco Chips Brownie', 40, 'pastries', false, null, null, '{"dairy"}', 54),
  ('smores-brownie', 'S''mores Brownie', 40, 'pastries', false, null, null, '{"dairy"}', 55),
  ('biscoff-blondie', 'Biscoff Blondie', 50, 'pastries', false, null, null, '{"dairy"}', 56),
  ('pistachio-brownie', 'Pistachio Brownie', 130, 'pastries', true, 'Regular. Double for ₱250.', null, '{"dairy","contains-nuts"}', 57),
  ('bottled-americano', 'Americano', 95, 'bottled', false, null, null, '{"coffee"}', 58),
  ('bottled-craffeccino', 'Crafféccino', 100, 'bottled', false, null, null, '{"coffee","dairy"}', 59),
  ('bottled-flat-white', 'Flat White', 120, 'bottled', false, null, null, '{"coffee","dairy"}', 60),
  ('bottled-caramel-macchiato', 'Caramel Macchiato', 125, 'bottled', false, null, null, '{"coffee","dairy"}', 61),
  ('bottled-spanish-latte', 'Spanish Latte', 125, 'bottled', true, null, null, '{"coffee","dairy"}', 62),
  ('bottled-hazelnut-latte', 'Hazelnut Latte', 135, 'bottled', false, null, null, '{"coffee","dairy","contains-nuts"}', 63),
  ('bottled-biscoff-latte', 'Biscoff Latte', 160, 'bottled', false, null, null, '{"coffee","dairy"}', 64),
  ('bottled-signature-chocolate', 'Signature Chocolate', 130, 'bottled', false, null, null, '{"caffeine-free","dairy"}', 65),
  ('bottled-matcha-latte', 'Matcha Latte', 125, 'bottled', false, null, null, '{"dairy"}', 66),
  ('bottled-sea-salt-matcha', 'Sea Salt Matcha', 145, 'bottled', true, null, null, '{"dairy"}', 67),
  ('bottled-strawberry-milk', 'Strawberry Milk', 120, 'bottled', false, null, null, '{"caffeine-free","dairy"}', 68),
  ('bottled-creamy-biscoff', 'Creamy Biscoff', 150, 'bottled', false, null, null, '{"caffeine-free","dairy"}', 69);
