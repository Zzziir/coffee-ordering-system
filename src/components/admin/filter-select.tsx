"use client";

import { useRouter } from "next/navigation";
import { Fragment, useTransition } from "react";
import { clsx } from "@/lib/clsx";
import { Select } from "@/components/select";
import { hrefWith } from "./format";

export type SelectOption = {
  value: string;
  label: string;
  /** Shown but not pickable, e.g. a segment with nobody in it. */
  disabled?: boolean;
  /** Options sharing a group are listed together under that heading. */
  group?: string;
  /**
   * The query params this option sets, when it stands for more than one (a
   * "where" that sets both source and branch). Defaults to `{ [name]: value }`.
   */
  patch?: Record<string, string | undefined>;
};

/** Options in order, gathered into their groups where they have one. */
function grouped(options: SelectOption[]) {
  const sections: { group?: string; options: SelectOption[] }[] = [];
  for (const option of options) {
    const last = sections.at(-1);
    if (last && last.group === option.group) last.options.push(option);
    else sections.push({ group: option.group, options: [option] });
  }
  return sections;
}

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
        "flex h-10 min-w-0 items-center gap-1.5 rounded-full border pl-3.5 text-[13px] transition-[border-color,background-color,opacity] focus-within:border-coffee",
        value ? "border-coffee/60 bg-coffee-tint/50" : "border-line bg-paper-raised",
        pending && "opacity-60",
      )}
    >
      <span className="shrink-0 text-ink-soft">{label}</span>
      <Select
        value={value}
        onChange={(e) => {
          const picked = options.find((option) => option.value === e.target.value);
          const patch = picked?.patch ?? { [name]: e.target.value || undefined };
          startTransition(() => router.push(hrefWith(path, query, patch), { scroll: false }));
        }}
        className="h-full max-w-[13rem] bg-transparent font-semibold text-ink outline-none"
      >
        {grouped(options).map((section, i) => {
          const items = section.options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ));
          return section.group ? (
            <optgroup key={section.group} label={section.group}>
              {items}
            </optgroup>
          ) : (
            <Fragment key={`plain-${i}`}>{items}</Fragment>
          );
        })}
      </Select>
    </label>
  );
}
