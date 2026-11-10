"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { PlusIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { Select } from "@/components/select";
import { textInputClass } from "@/components/text-input";
import { useToast } from "@/components/toast";
import { getBranch } from "@/lib/branches";
import { clsx } from "@/lib/clsx";
import type { StaffRole } from "@/lib/staff";
import { ROLE_LABEL } from "@/lib/team-rules";
import type { BranchId } from "@/lib/types";
import { addTeammate, type AddState } from "./actions";
import { TempPasswordField, generatePassword } from "./temp-password-field";

const ROLE_HINT: Partial<Record<StaffRole, string>> = {
  barista: "Runs their branch's order board.",
  manager: "Also opens the back office for their branch.",
};

/**
 * "Add teammate": a button that opens a panel from the side of the screen.
 * The list stays visible behind it, so the admin keeps their place. Built on
 * the native <dialog> for focus trapping, Escape and an inert background.
 */
export function AddTeammate({ roles, branches }: { roles: StaffRole[]; branches: BranchId[] }) {
  const [open, setOpen] = useState(false);
  // A fresh key per opening resets every field and the last error.
  const [session, setSession] = useState(0);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (roles.length === 0 || branches.length === 0) return null;

  const show = () => {
    setSession((n) => n + 1);
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="pressable inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[14px] font-semibold text-paper"
      >
        <PlusIcon size={16} weight="bold" aria-hidden />
        Add teammate
      </button>

      <dialog
        ref={ref}
        aria-label="Add a teammate"
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
        className="m-0 ml-auto h-[100dvh] max-h-none w-full max-w-md border-l border-line bg-paper-raised p-0 text-ink shadow-[var(--shadow-pop)] transition-[translate,opacity] duration-300 ease-[var(--ease-out)] backdrop:bg-black/50 motion-reduce:transition-none starting:open:translate-x-8 starting:open:opacity-0"
      >
        <AddForm
          key={session}
          roles={roles}
          branches={branches}
          onDone={() => setOpen(false)}
        />
      </dialog>
    </>
  );
}

function AddForm({
  roles,
  branches,
  onDone,
}: {
  roles: StaffRole[];
  branches: BranchId[];
  onDone: () => void;
}) {
  const toast = useToast();
  const [state, action] = useActionState<AddState, FormData>(addTeammate, null);
  // Controlled, because React resets uncontrolled fields after every form
  // action, which would wipe the form when the server sends back an error.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("barista");
  const [branch, setBranch] = useState<BranchId>(branches[0]);
  const [password, setPassword] = useState(generatePassword);
  const ids = { name: useId(), email: useId(), branch: useId(), password: useId() };

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message);
      onDone();
    }
    // Only a new result should close the panel, not a re-render.
  }, [state]);

  return (
    <form action={action} className="flex h-full flex-col">
      <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
        <div>
          <h2 className="text-[19px] font-bold tracking-tight text-ink">Add a teammate</h2>
          <p className="mt-1 text-[13.5px] text-ink-soft">
            They can sign in as soon as you save.
          </p>
        </div>
        <button
          type="button"
          onClick={onDone}
          aria-label="Close"
          className="pressable -mr-2 grid size-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-paper-sunk hover:text-ink"
        >
          <XIcon size={18} weight="bold" />
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
        <Field label="Full name" htmlFor={ids.name}>
          <input
            id={ids.name}
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            autoComplete="off"
            className={textInputClass}
          />
        </Field>

        <Field label="Email" htmlFor={ids.email} hint="They sign in with this.">
          <input
            id={ids.email}
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="off"
            spellCheck={false}
            className={textInputClass}
          />
        </Field>

        {roles.length > 1 ? (
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-[14px] font-medium text-ink">Role</legend>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((option) => (
                <label
                  key={option}
                  className={clsx(
                    "pressable flex cursor-pointer flex-col gap-0.5 rounded-[var(--radius-sm)] border px-4 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-coffee/40",
                    role === option ? "border-coffee bg-coffee-tint/50" : "border-line hover:border-line-strong",
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option}
                    checked={role === option}
                    onChange={() => setRole(option)}
                    className="sr-only"
                  />
                  <span className="text-[14.5px] font-semibold text-ink">{ROLE_LABEL[option]}</span>
                  <span className="text-[12.5px] leading-snug text-ink-soft">{ROLE_HINT[option]}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <input type="hidden" name="role" value={roles[0]} />
        )}

        {branches.length > 1 ? (
          <Field label="Branch" htmlFor={ids.branch}>
            <Select
              id={ids.branch}
              name="branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value as BranchId)}
              className={textInputClass}
            >
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {getBranch(branch).name}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <>
            <input type="hidden" name="branch" value={branches[0]} />
            <p className="text-[13.5px] text-ink-soft">
              Joins <span className="font-semibold text-ink">{getBranch(branches[0]).name}</span>.
            </p>
          </>
        )}

        <TempPasswordField id={ids.password} name="password" value={password} onChange={setPassword} />

        {state && !state.ok && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-[var(--radius-sm)] bg-warn/10 px-3.5 py-3 text-[13.5px] text-warn"
          >
            <WarningCircleIcon size={18} weight="fill" className="mt-px shrink-0" aria-hidden />
            {state.error}
          </p>
        )}
      </div>

      <footer className="flex gap-2.5 border-t border-line px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <button
          type="button"
          onClick={onDone}
          className="pressable h-11 flex-1 rounded-full border border-line-strong px-5 text-[14.5px] font-medium text-ink"
        >
          Cancel
        </button>
        <SaveButton />
      </footer>
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="pressable h-11 flex-[2] rounded-full bg-ink px-5 text-[14.5px] font-semibold text-paper transition-opacity disabled:opacity-60"
    >
      {pending ? "Adding" : "Add teammate"}
    </button>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[14px] font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="text-[12.5px] text-ink-faint">{hint}</p>}
    </div>
  );
}
