import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getCustomer } from "@/lib/customer";
import { GoogleButton } from "@/components/google-button";
import { signInWithGoogle } from "../actions";
import { SignInForm } from "./sign-in-form";

export const dynamic = "force-dynamic";

// Why a Google sign-in bounced back here (see app/auth/callback/route.ts).
const GOOGLE_ERRORS: Record<string, string> = {
  google: "Google sign-in didn't go through. Please try again.",
  "not-customer": "That account isn't set up as a Craffe customer.",
};

export default async function CustomerSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; check?: string; error?: string }>;
}) {
  const { next, check, error } = await searchParams;
  const googleError = error ? GOOGLE_ERRORS[error] : undefined;

  // Already signed in — no need to ask again.
  const customer = await getCustomer();
  if (customer) redirect(next?.startsWith("/account") ? next : "/account");

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader back="/" showBag={false} title="Sign in" />

      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-16 pt-10">
        <h1 className="text-[22px] font-bold tracking-tight text-ink">
          Welcome back
        </h1>
        <p className="mt-1.5 text-[15px] text-ink-soft">
          Sign in to see your orders and your rewards.
        </p>

        {check && (
          <p className="mt-5 rounded-[var(--radius-sm)] bg-coffee-tint/60 px-4 py-3 text-[14px] text-ink">
            Check your inbox to confirm your email, then sign in.
          </p>
        )}

        {googleError && (
          <p
            role="alert"
            className="mt-5 rounded-[var(--radius-sm)] bg-warn/10 px-4 py-3 text-[14px] text-warn"
          >
            {googleError}
          </p>
        )}

        <GoogleButton action={signInWithGoogle} next={next ?? null} />
        <SignInForm next={next ?? null} />

        <p className="mt-6 text-center text-[14.5px] text-ink-soft">
          New to Craffe?{" "}
          <Link
            href={next ? `/account/sign-up?next=${encodeURIComponent(next)}` : "/account/sign-up"}
            className="font-semibold text-coffee"
          >
            Create an account
          </Link>
        </p>
      </main>
    </div>
  );
}
