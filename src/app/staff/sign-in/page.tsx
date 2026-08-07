import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand";
import { getStaffMember, safeLandingPath } from "@/lib/staff";
import { SignInForm } from "./sign-in-form";

export const dynamic = "force-dynamic";

export default async function StaffSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

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

        <SignInForm next={next ?? null} />
      </main>
    </div>
  );
}
