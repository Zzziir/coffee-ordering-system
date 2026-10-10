"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { clsx } from "@/lib/clsx";
import { hrefWith } from "./format";

export type SelectOption = { value: string; label: string };

/**
 * A filter with too many choices for a row of pills. Like the pills, it lives
 * in the URL: picking an option navigates, so the view can be shared and the
 * back button undoes it. The first option is the "no filter" choice, with an
 * empty value; anything else tints the control so an active filter is obvious.
 */
export function FilterSelect({
  label,
  name,
  value,
  options,
  path,
  query,
}: {
  label: string;
  /** The query param this select owns. */
  name: string;
  value: string;
  options: SelectOption[];
  path: string;
  /** The other filters in play, kept as they are. */
  query: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label
      className={clsx(
        "flex h-10 min-w-0 items-center gap-1.5 rounded-full border pl-3.5 pr-2 text-[13px] transition-[border-color,background-color,opacity] focus-within:border-coffee",
        value ? "border-coffee/60 bg-coffee-tint/50" : "border-line bg-paper-raised",
        pending && "opacity-60",
      )}
    >
      <span className="shrink-0 text-ink-soft">{label}</span>
      <select
        value={value}
        onChange={(e) => {
          const next = e.target.value || undefined;
          startTransition(() => router.push(hrefWith(path, query, { [name]: next }), { scroll: false }));
        }}
        className="min-w-0 max-w-[11rem] cursor-pointer truncate bg-transparent py-1 font-semibold text-ink outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
