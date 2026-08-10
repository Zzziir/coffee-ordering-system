import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Wordmark } from "@/components/brand";
import { BRANCH_LIST, branchFullName, openStatusLabel } from "@/lib/branches";
import { getStaffMember, isAdmin, landingPath } from "@/lib/staff";
import { SignOutButton } from "./sign-out-button";
import { AdminLink } from "./admin-link";

export const dynamic = "force-dynamic";

/**
 * The branch list — only owners get here. Everyone else is pinned to one store,
 * so they're sent straight to it.
 */
export default async function StaffIndexPage() {
  const staff = await getStaffMember();
  if (!staff) redirect("/staff/sign-in?next=/staff");
  if (staff.branchId) redirect(landingPath(staff));

  return (
    <div className="min-h-[100dvh]">
      <header className="border-b border-line/70">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between gap-3 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Wordmark className="text-[18px] text-ink" />
            <span className="rounded-full bg-paper-sunk px-2.5 py-1 text-[12px] font-medium text-ink-soft">
              Owner view
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin(staff) && <AdminLink />}
            <SignOutButton name={staff.name} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-10 md:px-6">
        <h1 className="text-[22px] font-bold tracking-tight text-ink">
          Open a branch
        </h1>
        <p className="mt-1.5 text-[15px] text-ink-soft">
          Pick a store to see its queue.
        </p>

        <ul className="mt-6 flex flex-col gap-3">
          {BRANCH_LIST.map((branch) => (
            <li key={branch.id}>
              <Link
                href={`/staff/${branch.id}`}
                className="pressable flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5"
              >
                <span>
                  <span className="block text-[16px] font-semibold text-ink">
                    {branchFullName(branch)}
                  </span>
                  <span className="mt-0.5 block text-[14px] text-ink-soft">
                    {branch.addressLine} · {openStatusLabel(branch)}
                  </span>
                </span>
                <ArrowRightIcon size={18} weight="bold" className="shrink-0 text-coffee" />
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
