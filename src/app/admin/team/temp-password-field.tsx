"use client";

import { useState } from "react";
import { ArrowsClockwiseIcon, CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { textInputClass } from "@/components/text-input";
import { MIN_PASSWORD_LENGTH } from "@/lib/team-rules";
import { clsx } from "@/lib/clsx";

// No 0/O, 1/l/I: the admin reads this out or writes it down for someone.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/** Three groups of four, e.g. "k7mq-4hxp-9tdw": easy to read aloud, hard to guess. */
export function generatePassword(): string {
  const bytes = crypto.getRandomValues(new Uint32Array(12));
  const chars = Array.from(bytes, (n) => ALPHABET[n % ALPHABET.length]);
  return [0, 4, 8].map((start) => chars.slice(start, start + 4).join("")).join("-");
}

/**
 * A temporary password the admin hands over in person. It is shown in the
 * clear on purpose (they need to read it), comes pre-filled with a generated
 * one, and can be regenerated or copied in a tap.
 */
export function TempPasswordField({
  id,
  name,
  value,
  onChange,
  autoFocus,
}: {
  id: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked; the password is on screen to copy by hand.
    }
  };

  const iconButton =
    "pressable grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-paper-sunk hover:text-ink";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[14px] font-medium text-ink">
        Temporary password
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          minLength={MIN_PASSWORD_LENGTH}
          required
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          className={clsx(textInputClass, "pr-24 font-medium tabular-nums tracking-wide")}
        />
        <div className="absolute inset-y-0 right-1.5 flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onChange(generatePassword())}
            aria-label="Generate a new password"
            title="Generate a new password"
            className={iconButton}
          >
            <ArrowsClockwiseIcon size={17} weight="bold" />
          </button>
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? "Copied" : "Copy password"}
            title="Copy password"
            className={clsx(iconButton, copied && "text-ready hover:text-ready")}
          >
            {copied ? <CheckIcon size={17} weight="bold" /> : <CopyIcon size={17} weight="bold" />}
          </button>
        </div>
      </div>
      <p className="text-[12.5px] text-ink-faint">
        At least {MIN_PASSWORD_LENGTH} characters. Share it with them in person.
      </p>
    </div>
  );
}
