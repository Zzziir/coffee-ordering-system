import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { BranchLockup } from "@/components/branch-lockup";
import { StaffQueue } from "@/components/staff-queue";
import { ensureDemoSeed, listActiveOrders } from "@/lib/store";
import { getBranch, isBranchId } from "@/lib/branches";
import { canAccessBranch, getStaffMember, landingPath } from "@/lib/staff";
import { SignOutButton } from "../sign-out-button";

export const dynamic = "force-dynamic";

/**
 * One branch's barista board.
 *
 * A barista may only open their own store; owners may open any. The check is
 * here rather than in proxy.ts on purpose — proxy only asks "is anyone signed
 * in", and a matcher change must not be able to quietly unlock a branch.
 */
export default async function StaffBranchPage({
  params,
}: {
  params: Promise<{ branch: string }>;
}) {
  const { branch: branchParam } = await params;
  if (!isBranchId(branchParam)) notFound();

  const branch = getBranch(branchParam);

  const staff = await getStaffMember();
  if (!staff) redirect(`/staff/sign-in?next=/staff/${branch.id}`);
  if (!canAccessBranch(staff, branch.id)) {
    return <WrongBranch staffName={staff.name} branchName={branch.lockupName} home={landingPath(staff)} />;
  }

  // Seed a couple of in-flight orders so the board isn't empty for a first look.
  await ensureDemoSeed();
  const orders = await listActiveOrders(branch.id);

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/staff" className="pressable">
              <BranchLockup branch={branch} className="h-6 text-[18px] text-ink" />
            </Link>
            <span className="rounded-full bg-paper-sunk px-2.5 py-1 text-[12px] font-medium text-ink-soft">
              {branch.name}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-[13px] font-medium text-ink-soft">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-ready opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-ready" />
              </span>
              Live
            </span>
            <SignOutButton name={staff.name} />
          </div>
        </div>
      </header>

      <StaffQueue branchId={branch.id} initial={orders} />
    </div>
  );
}

function WrongBranch({
  staffName,
  branchName,
  home,
}: {
  staffName: string;
  branchName: string;
  home: string;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-5 text-center">
      <Wordmark className="text-[18px] text-ink" />
      <h1 className="mt-6 text-[20px] font-bold tracking-tight text-ink">
        That&apos;s not your branch
      </h1>
      <p className="mt-2 max-w-sm text-[15px] text-ink-soft">
        {staffName}, your account isn&apos;t set up for {branchName}. Ask an
        owner if you need to cover a shift there.
      </p>
      <Link
        href={home}
        className="pressable mt-7 flex h-12 items-center justify-center rounded-full bg-ink px-7 text-[15px] font-semibold text-paper"
      >
        Back to your queue
      </Link>
    </div>
  );
}
