"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateProfile, type AuthState } from "../actions";
import { Field, textInputClass } from "../fields";
import type { Customer } from "@/lib/customer";

export function EditForm({ customer }: { customer: Customer }) {
  const [state, formAction] = useActionState<AuthState, FormData>(
    updateProfile,
    null,
  );

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" htmlFor="firstName">
          <input
            id="firstName"
            name="firstName"
            required
            defaultValue={customer.firstName}
            autoComplete="given-name"
            className={textInputClass}
          />
        </Field>
        <Field label="Last name" htmlFor="lastName">
          <input
            id="lastName"
            name="lastName"
            required
            defaultValue={customer.lastName}
            autoComplete="family-name"
            className={textInputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Age" htmlFor="age" optional>
          <input
            id="age"
            name="age"
            type="number"
            min={13}
            max={120}
            inputMode="numeric"
            defaultValue={customer.age ?? ""}
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
            defaultValue={customer.phone ?? ""}
            className={textInputClass}
          />
        </Field>
      </div>

      <Field label="Favorite coffee flavor" htmlFor="favoriteFlavor" optional>
        <input
          id="favoriteFlavor"
          name="favoriteFlavor"
          placeholder="Spanish Latte, matcha, you name it"
          defaultValue={customer.favoriteFlavor ?? ""}
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
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}
