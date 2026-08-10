-- Craffé — storage for menu item photos.
--
-- Admins upload an item's photo from the menu editor; the file lands in this
-- bucket and its public URL is saved on menu_items.image. Reads are public (a
-- menu photo is not a secret); uploads happen server-side on the service role
-- behind the admin gate, so no storage write policy is needed here.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu',
  'menu',
  true,
  5242880, -- 5 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;
