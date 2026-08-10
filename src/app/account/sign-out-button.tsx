"use client";

import { useTransition } from "react";
import { SignOutIcon } from "@phosphor-icons/react";
import { signOut } from "./actions";

/** Signs the customer out through the server action, then lands on sign-in. */
export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => signOut())}
      disabled={pending}
      className="pressable flex h-12 w-full items-center justify-center gap-2 rounded-full border border-line bg-paper-raised text-[15px] font-semibold text-ink-soft hover:text-ink disabled:opacity-70"
    >
      <SignOutIcon size={18} weight="bold" />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
