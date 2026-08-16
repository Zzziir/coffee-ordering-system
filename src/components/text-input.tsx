"use client";

import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";

/** Shared text-input styling for the account and staff forms. */
export const textInputClass =
  "h-12 w-full rounded-[var(--radius-sm)] border border-line bg-paper-raised px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-coffee";

/**
 * Password field with a show/hide toggle. Leaves room on the right for the eye
 * button by swapping the shared field's symmetric padding for a wider gutter.
 */
export function PasswordInput({
  id = "password",
  name = "password",
  autoComplete,
  minLength,
  placeholder,
  required,
  defaultValue,
}: {
  id?: string;
  name?: string;
  autoComplete?: string;
  minLength?: number;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className={textInputClass.replace("px-4", "pl-4 pr-12")}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="pressable absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee/40"
      >
        {visible ? (
          <EyeSlashIcon size={19} weight="regular" />
        ) : (
          <EyeIcon size={19} weight="regular" />
        )}
      </button>
    </div>
  );
}
