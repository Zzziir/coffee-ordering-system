import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getCustomer } from "@/lib/customer";
import { SignUpForm } from "./sign-up-form";

export const dynamic = "force-dynamic";

export default async function CustomerSignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  const customer = await getCustomer();
  if (customer) redirect(next?.startsWith("/account") ? next : "/account");

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader back="/account/sign-in" showBag={false} title="Create account" />

      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-16 pt-10">
        <h1 className="text-[22px] font-bold tracking-tight text-ink">
          Join Craffe Rewards
        </h1>
        <p className="mt-1.5 text-[15px] text-ink-soft">
          Save your orders and earn a sticker for every drink. Buy nine, the tenth
          is on us.
        </p>

        <SignUpForm next={next ?? null} />

        <p className="mt-6 text-center text-[14.5px] text-ink-soft">
          Already have an account?{" "}
          <Link
            href={next ? `/account/sign-in?next=${encodeURIComponent(next)}` : "/account/sign-in"}
            className="font-semibold text-coffee"
          >
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
