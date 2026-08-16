"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, type SignInState } from "../actions";
import { PasswordInput, textInputClass } from "@/components/text-input";

export function SignInForm({ next }: { next: string | null }) {
  const [state, formAction] = useActionState<SignInState, FormData>(signIn, null);

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-3">
      {next && <input type="hidden" name="next" value={next} />}

      <Field label="Email" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          placeholder="you@craffe.ph"
          className={textInputClass}
        />
      </Field>

      <Field label="Password" htmlFor="password">
        <PasswordInput autoComplete="current-password" required />
      </Field>

      {state?.error && (
        <p
          role="alert"
          className="rounded-[var(--radius-sm)] bg-warn/10 px-4 py-3 text-[14px] text-warn"
        >
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="pressable mt-2 flex h-14 w-full items-center justify-center rounded-full bg-ink text-[16px] font-semibold text-paper disabled:opacity-70"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[14px] font-medium text-ink">
        {label}
      </label>
      {children}
    </div>
  );
}
