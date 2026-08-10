import { supabaseAdmin } from "./supabase/admin";
import type { AddOn, AddOnGroup, Category, DietTag, MenuData, MenuItem } from "./menu";

/**
 * Loads the whole menu from Postgres and assembles it into a `MenuData` bundle
 * shaped exactly like the old static module, so the rest of the app is unchanged.
 *
 * Reads on the service role, like the order store — the catalog is small and
 * read on nearly every page, so it comes back in one round of parallel queries.
 * Every item is returned with its `available` flag; the customer menu filters
 * sold-out drinks at render time, while loyalty and history need them all so a
 * past order still resolves its drink.
 */
export async function getMenu(): Promise<MenuData> {
  const sb = supabaseAdmin();

  const [cats, groups, addOns, catGroups, items] = await Promise.all([
    sb.from("menu_categories").select("id, name, note, kind, position").order("position"),
    sb.from("menu_add_on_groups").select("id, name, type, default_option_id"),
    sb.from("menu_add_ons").select("id, group_id, name, price, position").order("position"),
    sb.from("menu_category_groups").select("category_id, group_id, position").order("position"),
    sb
      .from("menu_items")
      .select("id, name, price, category_id, signature, description, image, tags, available, position")
      .order("position"),
  ]);

  const firstError =
    cats.error || groups.error || addOns.error || catGroups.error || items.error;
  if (firstError) throw new Error(`Could not load the menu: ${firstError.message}`);

  // Options grouped under their add-on group, in position order.
  const optionsByGroup = new Map<string, AddOn[]>();
  for (const a of addOns.data ?? []) {
    const list = optionsByGroup.get(a.group_id) ?? [];
    list.push({ id: a.id, name: a.name, price: a.price });
    optionsByGroup.set(a.group_id, list);
  }

  const addOnGroups: Record<string, AddOnGroup> = {};
  for (const g of groups.data ?? []) {
    addOnGroups[g.id] = {
      id: g.id,
      name: g.name,
      type: g.type as AddOnGroup["type"],
      defaultOptionId: g.default_option_id ?? undefined,
      options: optionsByGroup.get(g.id) ?? [],
    };
  }

  // Group ids per category, in position order.
  const groupIdsByCategory = new Map<string, string[]>();
  for (const cg of catGroups.data ?? []) {
    const list = groupIdsByCategory.get(cg.category_id) ?? [];
    list.push(cg.group_id);
    groupIdsByCategory.set(cg.category_id, list);
  }

  const categories: Category[] = (cats.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    note: c.note ?? undefined,
    kind: c.kind as Category["kind"],
    addOnGroups: groupIdsByCategory.get(c.id) ?? [],
  }));

  const menuItems: MenuItem[] = (items.data ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    price: i.price,
    categoryId: i.category_id,
    signature: i.signature,
    description: i.description ?? undefined,
    tags: (i.tags ?? []) as DietTag[],
    image: i.image ?? undefined,
    available: i.available,
  }));

  return { categories, items: menuItems, addOnGroups };
}
