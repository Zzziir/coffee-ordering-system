import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Keeps signed-in sessions alive, and bounces signed-out visitors away from the
 * two gated areas to the right sign-in.
 *
 * This is the one place that can write a refreshed auth cookie: Server
 * Components are not allowed to set cookies, so without this every render would
 * re-refresh an expiring token and never persist the result.
 *
 * The redirects here are an optimistic check only — they ask "is anyone signed
 * in", not "may they open this". Real authorisation lives in the pages and route
 * handlers (see lib/staff and lib/customer), which is where it has to be: a
 * matcher change or a moved Server Function can silently drop proxy coverage.
 */

const STAFF_SIGN_IN = "/staff/sign-in";
const ACCOUNT_SIGN_IN = "/account/sign-in";

// Public entry points inside otherwise-gated areas.
const PUBLIC_PATHS = new Set([
  STAFF_SIGN_IN,
  ACCOUNT_SIGN_IN,
  "/account/sign-up",
]);

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(toSet, headers) {
        for (const { name, value, options } of toSet) {
          response.cookies.set(name, value, options);
        }
        // Responses that set auth cookies must never be cached — one person's
        // token would be served to the next.
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (!user && !PUBLIC_PATHS.has(path)) {
    // Send staff to the staff sign-in, customers to the customer one.
    const signIn = path.startsWith("/account") ? ACCOUNT_SIGN_IN : STAFF_SIGN_IN;
    const url = request.nextUrl.clone();
    url.pathname = signIn;
    url.search = "";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/staff",
    "/staff/:path*",
    "/account",
    "/account/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
