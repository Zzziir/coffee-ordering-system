import { redirect } from "next/navigation";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { getStaffMember, isAdmin, landingPath } from "@/lib/staff";
import { SignOutButton } from "../staff/sign-out-button";
import { AdminNav } from "./admin-nav";

export const dynamic = "force-dynamic";

/**
 * The back office. Admins are owners and managers on the staff roster, so this
 * shares the staff session — no separate login. proxy.ts checks someone is
 * signed in; the real authorisation is here: a barista is bounced to their board.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getStaffMember();
  if (!staff) redirect("/staff/sign-in?next=/admin");
  if (!isAdmin(staff)) redirect(landingPath(staff));

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link href="/admin" className="pressable flex items-center gap-2.5">
            <Wordmark className="text-[18px] text-ink" />
            <span className="rounded-full bg-paper-sunk px-2.5 py-1 text-[12px] font-medium text-ink-soft">
              Admin
            </span>
          </Link>
          <SignOutButton name={staff.name} />
        </div>
        <AdminNav />
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6">{children}</main>
    </div>
  );
}
