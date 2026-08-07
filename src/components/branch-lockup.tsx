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
        src={branch.logo}
        alt={branch.lockupName}
        width={180}
        height={60}
        className={clsx("w-auto object-contain", className)}
        priority
      />
    );
  }

  return <Wordmark className={className} />;
}
