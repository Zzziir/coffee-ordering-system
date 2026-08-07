import { Wordmark } from "@/components/brand";
import { StaffQueue } from "@/components/staff-queue";
import { ensureDemoSeed, listActiveOrders } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function StaffPage() {
  // Seed a couple of in-flight orders so the board isn't empty for a first look.
  ensureDemoSeed();
  const orders = listActiveOrders();

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Wordmark className="text-[18px] text-ink" />
            <span className="rounded-full bg-paper-sunk px-2.5 py-1 text-[12px] font-medium text-ink-soft">
              Barista view
            </span>
          </div>
          <span className="flex items-center gap-2 text-[13px] font-medium text-ink-soft">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-ready opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-ready" />
            </span>
            Live
          </span>
        </div>
      </header>

      <StaffQueue initial={orders} />
    </div>
  );
}
