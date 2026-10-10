"use client";

import { useState, useTransition } from "react";
import { SignOutIcon } from "@phosphor-icons/react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { signOut } from "./actions";

/**
 * Who's on shift, and the way off it. Shown in every staff header. On a phone
 * it is a lone icon beside other icons, so a stray tap asks before it ends the
 * shift's session.
 */
export function SignOutButton({ name }: { name: string }) {
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-[13px] text-ink-soft sm:inline">{name}</span>
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="pressable grid size-10 place-items-center rounded-full border border-line text-[13px] font-medium text-ink-soft sm:block sm:size-auto sm:h-9 sm:px-3.5"
      >
        <SignOutIcon size={17} weight="bold" className="sm:hidden" aria-hidden />
        <span className="sr-only sm:not-sr-only">Sign out</span>
      </button>

      <ConfirmDialog
        open={asking}
        title="Sign out?"
        confirmLabel="Sign out"
        pendingLabel="Signing out…"
        pending={pending}
        onConfirm={() => startTransition(() => signOut())}
        onCancel={() => setAsking(false)}
      >
        {name}, you&apos;ll need to sign in again to get back to the board.
      </ConfirmDialog>
    </div>
  );
}
