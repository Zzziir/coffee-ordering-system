import Image from "next/image";
import { Wordmark } from "./brand";
import type { Branch } from "@/lib/branches";
import { clsx } from "@/lib/clsx";

/**
 * How a branch signs itself at the touchpoints where the customer is standing
 * in that particular shop: the QR card, the order-status screen, the receipt,
 * the barista's board.
 *
 * A partner store with its own signage — MYCC — shows its mark; everyone else
 * shows plain Craffé. Marketing pages stay unified Craffé and deliberately do
 * not use this: the co-branding is meant to say "you are here", not to split
 * the brand.
 */
export function BranchLockup({
  branch,
  className,
}: {
  branch: Branch;
  className?: string;
}) {
  if (branch.logo) {
    return (
      <Image
        src={branch.logo.src}
        alt={branch.lockupName}
        width={branch.logo.width}
        height={branch.logo.height}
        // Callers size it h-6 to h-7 (24 to 28px), so ask for a file that
        // small rather than one at the source's full width.
        sizes="32px"
        className={clsx("w-auto object-contain", className)}
        // Sits at the top of every screen that shows it.
        loading="eager"
      />
    );
  }

  return <Wordmark className={className} />;
}
