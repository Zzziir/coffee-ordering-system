"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, type AuthState } from "../actions";
import { Field, textInputClass } from "../fields";

export function SignInForm({ next }: { next: string | null }) {
  const [state, formAction] = useActionState<AuthState, FormData>(signIn, null);

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
          placeholder="you@email.com"
          className={textInputClass}
        />
      </Field>

      <Field label="Password" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={textInputClass}
        />
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
