import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Wordmark } from "@/components/brand";
import { BRANCH_LIST, branchAddress, branchFullName } from "@/lib/branches";

export const metadata = {
  title: "Table tents — Craffé",
};

/** Which card do you want to print? One per branch, each carrying its own `?b=`. */
export default function QrIndexPage() {
  return (
    <div className="min-h-[100dvh]">
      <header className="border-b border-line/70">
        <div className="mx-auto flex h-16 max-w-2xl items-center gap-3 px-4 md:px-6">
          <Wordmark className="text-[18px] text-ink" />
          <span className="rounded-full bg-paper-sunk px-2.5 py-1 text-[12px] font-medium text-ink-soft">
            Table tents
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-10 md:px-6">
        <h1 className="text-[22px] font-bold tracking-tight text-ink">
          Print a scan card
        </h1>
        <p className="mt-1.5 text-[15px] text-ink-soft">
          Each branch gets its own code. Scanning it sends the order to that
          counter — no one has to pick a store.
        </p>

        <ul className="mt-6 flex flex-col gap-3">
          {BRANCH_LIST.map((branch) => (
            <li key={branch.id}>
              <Link
                href={`/qr/${branch.id}`}
                className="pressable flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5"
              >
                <span>
                  <span className="block text-[16px] font-semibold text-ink">
                    {branchFullName(branch)}
                  </span>
                  <span className="mt-0.5 block text-[14px] text-ink-soft">
                    {branchAddress(branch)}
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
