import { NextResponse } from "next/server";
import { getCustomer } from "@/lib/customer";
import { getLoyalty } from "@/lib/loyalty";
import { getMenu } from "@/lib/menu-store";
import { isDrinkItem } from "@/lib/menu";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// A guest can carry at most this many stamps into a new account. It only caps
// abuse of the client-supplied figure; an honest tally is nowhere near it.
const SEED_CAP = 200;

/**
 * What the checkout reward UI needs in one call:
 *   free          how many free drinks the signed-in customer can redeem now
 *   drinkItemIds  which menu items are drinks, so the picker offers only those
 *
 * A guest has no server balance, so `free` is 0 for them — one more nudge to
 * sign in. The drink list is public menu shape, safe to return either way.
 */
export async function GET() {
  const [customer, menu] = await Promise.all([getCustomer(), getMenu()]);
  const drinkItemIds = menu.items
    .filter((item) => isDrinkItem(menu, item.id))
    .map((item) => item.id);

  const free = customer ? (await getLoyalty(customer.id)).free : 0;
  return NextResponse.json({ free, drinkItemIds });
}

/**
 * Migrate a guest's on-device stamp tally into their account, once, right after
 * they sign up or sign in. Additive: it tops up loyalty_seed so the stamps they
 * earned before the account count toward their card. Identity is the session,
 * never the body — a guest with no session has nothing to migrate.
 */
export async function POST(req: Request) {
  const customer = await getCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = Number((body as Record<string, unknown>)?.stamps);
  const stamps = Number.isFinite(raw) ? Math.min(Math.max(Math.trunc(raw), 0), SEED_CAP) : 0;
  if (stamps === 0) {
    return NextResponse.json({ credited: 0 });
  }

  const admin = supabaseAdmin();
  const { data: profile, error: readErr } = await admin
    .from("profiles")
    .select("loyalty_seed")
    .eq("id", customer.id)
    .maybeSingle<{ loyalty_seed: number }>();
  if (readErr) {
    return NextResponse.json({ error: "Could not read your rewards." }, { status: 500 });
  }

  const next = Math.min((profile?.loyalty_seed ?? 0) + stamps, SEED_CAP);
  const { error: writeErr } = await admin
    .from("profiles")
    .update({ loyalty_seed: next })
    .eq("id", customer.id);
  if (writeErr) {
    return NextResponse.json({ error: "Could not save your rewards." }, { status: 500 });
  }

  return NextResponse.json({ credited: stamps });
}
