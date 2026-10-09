import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand";
import { GoogleButton } from "@/components/google-button";
import { getStaffMember, safeLandingPath } from "@/lib/staff";
import { signInWithGoogle } from "../actions";
import { SignInForm } from "./sign-in-form";

export const dynamic = "force-dynamic";

// Why someone was sent back here: a Google sign-in that failed or wasn't on
// the roster (app/auth/callback/route.ts), or a customer who wandered into the
// back office (app/admin/layout.tsx).
const NOTICES: Record<string, string> = {
  google: "Google sign-in didn't go through. Please try again.",
  "not-staff": "That Google account isn't set up for a Craffé branch.",
  "staff-only":
    "This area is for Craffé staff. Sign in with your staff account to continue.",
};

export default async function StaffSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const notice = error ? NOTICES[error] : undefined;

  // Already on shift — don't make them sign in twice.
  const staff = await getStaffMember();
  if (staff) redirect(safeLandingPath(staff, next ?? null));

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="border-b border-line/70">
        <div className="mx-auto flex h-16 max-w-md items-center gap-3 px-5">
          <Wordmark className="text-[18px] text-ink" />
          <span className="rounded-full bg-paper-sunk px-2.5 py-1 text-[12px] font-medium text-ink-soft">
            Barista view
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-16 pt-12">
        <h1 className="text-[22px] font-bold tracking-tight text-ink">Sign in</h1>
        <p className="mt-1.5 text-[15px] text-ink-soft">
          Use the account for your branch. You&apos;ll only see orders placed
          there.
        </p>

        {notice && (
          <p
            role="alert"
            className="mt-5 rounded-[var(--radius-sm)] bg-warn/10 px-4 py-3 text-[14px] text-warn"
          >
            {notice}
          </p>
        )}

        <GoogleButton action={signInWithGoogle} next={next ?? null} />
        <SignInForm next={next ?? null} />
      </main>
    </div>
  );
}
