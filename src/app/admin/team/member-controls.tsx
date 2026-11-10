"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ArrowCounterClockwiseIcon, KeyIcon, ProhibitIcon } from "@phosphor-icons/react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Select } from "@/components/select";
import { useToast } from "@/components/toast";
import { BRANCH_LIST, getBranch } from "@/lib/branches";
import { MIN_PASSWORD_LENGTH } from "@/lib/team-rules";
import type { BranchId } from "@/lib/types";
import { moveBranch, resetPassword, setActive, type ActionResult } from "./actions";
import { TempPasswordField, generatePassword } from "./temp-password-field";

/** Runs a Team action and reports how it went. Returns whether it worked. */
function useTeamAction() {
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<ActionResult>, after?: (ok: boolean) => void) =>
    startTransition(async () => {
      try {
        const result = await action();
        if (result.ok) toast.success(result.message);
        else toast.error(result.error);
        after?.(result.ok);
      } catch {
        toast.error("Something went wrong. Try again.");
        after?.(false);
      }
    });

  return { pending, run };
}

/**
 * The branch a teammate works at, changeable by owners. Moving someone changes
 * which board they can open, so it is confirmed first.
 */
export function MoveBranch({ id, name, branchId }: { id: string; name: string; branchId: BranchId }) {
  const [optimistic, setOptimistic] = useOptimistic(branchId);
  const [target, setTarget] = useState<BranchId | null>(null);
  const { pending, run } = useTeamAction();

  const move = () => {
    if (!target) return;
    const next = target;
    setTarget(null);
    run(async () => {
      setOptimistic(next);
      return moveBranch(id, next);
    });
  };

  return (
    <>
      <Select
        aria-label={`Branch for ${name}`}
        value={optimistic}
        disabled={pending}
        onChange={(e) => setTarget(e.target.value as BranchId)}
        className="h-9 rounded-full border border-line bg-paper pl-4 text-[13.5px] font-medium text-ink outline-none transition-colors focus:border-coffee disabled:opacity-60"
      >
        {BRANCH_LIST.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </Select>

      <ConfirmDialog
        open={target !== null}
        title={`Move ${name} to ${target ? getBranch(target).name : ""}?`}
        confirmLabel="Move"
        onConfirm={move}
        onCancel={() => setTarget(null)}
      >
        They will see the {target ? getBranch(target).name : ""} board instead of{" "}
        {getBranch(optimistic).name}&apos;s from their next page load.
      </ConfirmDialog>
    </>
  );
}

const actionButton =
  "pressable inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-medium transition-colors disabled:opacity-60";

/** Reset password and deactivate (or reactivate) for one teammate. */
export function MemberActions({ id, name, active }: { id: string; name: string; active: boolean }) {
  const [dialog, setDialog] = useState<"password" | "deactivate" | null>(null);
  const [password, setPassword] = useState("");
  const { pending, run } = useTeamAction();
  const close = () => setDialog(null);

  const openPassword = () => {
    setPassword(generatePassword());
    setDialog("password");
  };

  return (
    <div className="flex items-center justify-end gap-1">
      {active ? (
        <>
          <button
            type="button"
            onClick={openPassword}
            disabled={pending}
            className={`${actionButton} text-ink-soft hover:bg-paper-sunk hover:text-ink`}
          >
            <KeyIcon size={16} weight="bold" aria-hidden />
            Reset password
          </button>
          <button
            type="button"
            onClick={() => setDialog("deactivate")}
            disabled={pending}
            className={`${actionButton} text-warn hover:bg-warn/10`}
          >
            <ProhibitIcon size={16} weight="bold" aria-hidden />
            Deactivate
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => run(() => setActive(id, true))}
          disabled={pending}
          className={`${actionButton} border border-line-strong text-ink hover:bg-paper-sunk`}
        >
          <ArrowCounterClockwiseIcon size={16} weight="bold" aria-hidden />
          {pending ? "Reactivating" : "Reactivate"}
        </button>
      )}

      <ConfirmDialog
        open={dialog === "password"}
        title={`New password for ${name}`}
        confirmLabel="Set password"
        pendingLabel="Saving"
        pending={pending}
        onConfirm={() => {
          if (password.length < MIN_PASSWORD_LENGTH) return;
          run(() => resetPassword(id, password), (ok) => ok && close());
        }}
        onCancel={close}
      >
        <p>Their old password stops working straight away.</p>
        <div className="mt-4 text-left">
          <TempPasswordField id={`password-${id}`} value={password} onChange={setPassword} autoFocus />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog === "deactivate"}
        title={`Deactivate ${name}?`}
        confirmLabel="Deactivate"
        pendingLabel="Deactivating"
        pending={pending}
        onConfirm={() => run(() => setActive(id, false), (ok) => ok && close())}
        onCancel={close}
      >
        They are signed out and can&apos;t sign back in. Their name stays on past orders, and you
        can reactivate them at any time.
      </ConfirmDialog>
    </div>
  );
}
