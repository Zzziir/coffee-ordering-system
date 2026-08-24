import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Keeps the Supabase project awake.
 *
 * Free-tier Supabase auto-pauses a project after ~7 days without database
 * activity, which takes every DB-backed page down with a 500 (see the home
 * page's graceful fallback for the other half of that story). A once-a-day
 * cron hitting this route runs one trivial query, which counts as activity and
 * resets the idle timer with a wide margin.
 *
 * Wired up as a Vercel cron in `vercel.json`. When `CRON_SECRET` is set, Vercel
 * sends it as a Bearer token and we reject anything else, so the endpoint isn't
 * a public button. If it's unset, the ping still works — it just isn't guarded.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // A HEAD count touches the DB without pulling rows — the cheapest possible
  // "are you awake" knock.
  const { error } = await supabaseAdmin()
    .from("menu_categories")
    .select("id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
  }

  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
