import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Keeps the staff session alive, and bounces signed-out visitors to sign-in.
 *
 * This is the one place that can write a refreshed auth cookie: Server
 * Components are not allowed to set cookies, so without this every render would
 * re-refresh an expiring token and never persist the result.
 *
 * The redirect here is an optimistic check only — it asks "is anyone signed
 * in", not "may they open this branch". Real authorisation lives in the pages
 * and route handlers (see lib/staff), which is where it has to be: a matcher
 * change or a moved Server Function can silently drop proxy coverage.
 */

const SIGN_IN = "/staff/sign-in";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(toSet, headers) {
        for (const { name, value, options } of toSet) {
          response.cookies.set(name, value, options);
        }
        // Responses that set auth cookies must never be cached — one staff
        // member's token would be served to the next.
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname !== SIGN_IN) {
    const url = request.nextUrl.clone();
    url.pathname = SIGN_IN;
    url.search = "";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/staff", "/staff/:path*"],
};
