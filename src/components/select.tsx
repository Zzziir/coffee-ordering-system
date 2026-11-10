import type { ComponentProps } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { clsx } from "@/lib/clsx";

/**
 * A native <select> with our own caret. The browser's arrow hugs the field's
 * edge and ignores padding, so it looks misplaced in a pill or a rounded input.
 * It is hidden and a caret is drawn inside the padding instead, keeping the
 * native picker (and its keyboard and mobile behaviour) intact.
 *
 * className styles the field itself: size, border, background, type.
 */
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <span className="relative inline-flex min-w-0">
      <select
        {...props}
        className={clsx(
          "w-full min-w-0 cursor-pointer appearance-none truncate disabled:cursor-default",
          className,
          // Last, so it wins over a caller's px-*: the caret lives in this gutter.
          "pr-10",
        )}
      >
        {children}
      </select>
      <CaretDownIcon
        size={13}
        weight="bold"
        aria-hidden
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft"
      />
    </span>
  );
}
