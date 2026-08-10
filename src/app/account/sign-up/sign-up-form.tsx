"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signUp, type AuthState } from "../actions";
import { Field, textInputClass } from "../fields";

export function SignUpForm({ next }: { next: string | null }) {
  const [state, formAction] = useActionState<AuthState, FormData>(signUp, null);

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-3">
      {next && <input type="hidden" name="next" value={next} />}

      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" htmlFor="firstName">
          <input
            id="firstName"
            name="firstName"
            required
            autoComplete="given-name"
            autoFocus
            className={textInputClass}
          />
        </Field>
        <Field label="Last name" htmlFor="lastName">
          <input
            id="lastName"
            name="lastName"
            required
            autoComplete="family-name"
            className={textInputClass}
          />
        </Field>
      </div>

      <Field label="Email" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
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
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className={textInputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Age" htmlFor="age" optional>
          <input
            id="age"
            name="age"
            type="number"
            min={13}
            max={120}
            inputMode="numeric"
            className={textInputClass}
          />
        </Field>
        <Field label="Mobile number" htmlFor="phone" optional>
          <input
            id="phone"
            name="phone"
            inputMode="tel"
            autoComplete="tel"
            placeholder="09XX XXX XXXX"
            className={textInputClass}
          />
        </Field>
      </div>

      <Field label="Favorite coffee flavor" htmlFor="favoriteFlavor" optional>
        <input
          id="favoriteFlavor"
          name="favoriteFlavor"
          placeholder="Spanish Latte, matcha, you name it"
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
      {pending ? "Creating your account…" : "Create account"}
    </button>
  );
}
