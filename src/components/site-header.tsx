"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaretLeftIcon, BagIcon } from "@phosphor-icons/react";
import { Wordmark } from "./brand";
import { useCart } from "./cart-provider";
import { clsx } from "@/lib/clsx";

export function SiteHeader({
  back,
  showBag = true,
  title,
}: {
  /** show a back button; true = router.back(), string = href */
  back?: boolean | string;
  showBag?: boolean;
  title?: string;
}) {
  const router = useRouter();
  const { count, hydrated } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-1">
          {back ? (
            typeof back === "string" ? (
              <Link
                href={back}
                aria-label="Back"
                className="pressable -ml-2 grid size-9 place-items-center rounded-full text-ink-soft hover:text-ink"
              >
                <CaretLeftIcon size={22} weight="bold" />
              </Link>
            ) : (
              <button
                onClick={() => router.back()}
                aria-label="Back"
                className="pressable -ml-2 grid size-9 place-items-center rounded-full text-ink-soft hover:text-ink"
              >
                <CaretLeftIcon size={22} weight="bold" />
              </button>
            )
          ) : null}
          {title ? (
            <span className="truncate text-[17px] font-semibold">{title}</span>
          ) : (
            <Link href="/" aria-label="Craffé home" className="pressable">
              <Wordmark className="text-[19px] text-ink" />
            </Link>
          )}
        </div>

        {showBag && (
          <Link
            href="/cart"
            aria-label={`Bag, ${hydrated ? count : 0} items`}
            className="pressable relative grid size-10 place-items-center rounded-full text-ink hover:bg-paper-sunk"
          >
            <BagIcon size={23} weight="regular" />
            <span
              className={clsx(
                "absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-coffee px-1 text-[11px] font-bold leading-5 text-paper-raised transition-all duration-200",
                hydrated && count > 0 ? "scale-100 opacity-100" : "scale-75 opacity-0",
              )}
            >
              {hydrated ? count : 0}
            </span>
          </Link>
        )}
      </div>
    </header>
  );
}
