"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getStaffMember, isAdmin } from "@/lib/staff";
import type { DietTag } from "@/lib/menu";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Upload a chosen photo to the public `menu` storage bucket and return its URL.
 * Runs on the service role (the admin gate upstream is the authorisation), so
 * no storage write policy is needed. Returns a { url } or an { error } string.
 */
async function uploadImage(
  file: File,
  itemId: string,
): Promise<{ url: string } | { error: string }> {
  if (!file.type.startsWith("image/")) return { error: "Please choose an image file." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Image must be under 5 MB." };

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${itemId}-${Date.now()}.${ext}`;

  const admin = supabaseAdmin();
  const { error } = await admin.storage
    .from("menu")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) return { error: `Could not upload the image: ${error.message}` };

  return { url: admin.storage.from("menu").getPublicUrl(path).data.publicUrl };
}

/**
 * Menu edits, run by an admin (owner or manager). Writes go through the
 * caller's own Supabase session, so the menu_items RLS policy (is_staff_admin)
 * is the real gate; the check here just fails fast with a clean message.
 */

const DIET_TAGS: DietTag[] = [
  "coffee",
  "caffeine-free",
  "dairy",
  "oat-available",
  "contains-nuts",
  "vegan-friendly",
];

async function assertAdmin() {
  const staff = await getStaffMember();
  if (!staff || !isAdmin(staff)) redirect("/staff/sign-in?next=/admin/menu");
}

/** Whenever the catalog changes, refresh both the admin list and the storefront. */
function revalidateMenu() {
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  revalidatePath("/");
  revalidatePath("/contact");
}

/** The sold-out switch. */
export async function setAvailability(id: string, available: boolean) {
  await assertAdmin();
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("menu_items")
    .update({ available })
    .eq("id", id);
  if (error) throw new Error(`Could not update availability: ${error.message}`);
  revalidateMenu();
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type ItemFormState = { error: string } | null;

/** Create a new item, or update an existing one when a hidden id is present. */
export async function saveItem(
  _previous: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  await assertAdmin();
  const supabase = await createServerSupabase();

  const existingId = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const signature = formData.get("signature") === "on";
  const available = formData.get("available") === "on";
  const tags = formData
    .getAll("tags")
    .map(String)
    .filter((t): t is DietTag => (DIET_TAGS as string[]).includes(t));

  // Photo: keep the current one, drop it, or replace it with a new upload.
  const currentImage = String(formData.get("currentImage") ?? "").trim() || null;
  const removePhoto = formData.get("removePhoto") === "on";
  const file = formData.get("imageFile");

  if (!name) return { error: "A name is required." };
  if (!categoryId) return { error: "Pick a category." };
  const price = Number(priceRaw);
  if (!Number.isInteger(price) || price < 0) {
    return { error: "Price must be a whole number of pesos." };
  }

  // Resolve the id up front: an upload's filename needs it, and a new item also
  // needs its end-of-section position.
  let finalId = existingId;
  let position = 0;
  if (!existingId) {
    const { data: rows } = await supabase.from("menu_items").select("id, position");
    const ids = new Set((rows ?? []).map((r) => r.id));
    let id = slugify(name) || "item";
    let n = 2;
    while (ids.has(id)) id = `${slugify(name)}-${n++}`;
    finalId = id;
    position = (rows ?? []).reduce((m, r) => Math.max(m, r.position), -1) + 1;
  }

  let image = removePhoto ? null : currentImage;
  if (file instanceof File && file.size > 0) {
    const result = await uploadImage(file, finalId);
    if ("error" in result) return result;
    image = result.url;
  }

  const fields = {
    name,
    price,
    category_id: categoryId,
    description: description || null,
    image,
    signature,
    available,
    tags,
  };

  if (existingId) {
    const { error } = await supabase
      .from("menu_items")
      .update(fields)
      .eq("id", existingId);
    if (error) return { error: `Could not save: ${error.message}` };
  } else {
    const { error } = await supabase
      .from("menu_items")
      .insert({ id: finalId, ...fields, position });
    if (error) return { error: `Could not create the item: ${error.message}` };
  }

  revalidateMenu();
  redirect("/admin/menu");
}
