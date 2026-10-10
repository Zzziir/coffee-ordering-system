"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { BRANCH_LIST } from "@/lib/branches";
import type { SalesEvent } from "@/lib/sales-events";
import { textInputClass } from "@/components/text-input";
import { saveEvent, type EventFormState } from "./actions";

/** Create or edit a bazaar. With `event` it edits; without, it creates. */
export function EventForm({ event }: { event?: SalesEvent }) {
  const [state, formAction] = useActionState<EventFormState, FormData>(saveEvent, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {event && <input type="hidden" name="id" value={event.id} />}

      <Field label="Event name" htmlFor="name">
        <input
          id="name"
          name="name"
          required
          defaultValue={event?.name}
          placeholder="Weekend Night Market"
          className={textInputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Venue" htmlFor="venue" optional>
          <input id="venue" name="venue" defaultValue={event?.venue ?? ""} className={textInputClass} />
        </Field>
        <Field label="City" htmlFor="city" optional>
          <input id="city" name="city" defaultValue={event?.city ?? ""} className={textInputClass} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts" htmlFor="startsOn" optional>
          <input
            id="startsOn"
            name="startsOn"
            type="date"
            defaultValue={event?.startsOn ?? ""}
            className={textInputClass}
          />
        </Field>
        <Field label="Ends" htmlFor="endsOn" optional hint="Leave blank for a one-day event.">
          <input
            id="endsOn"
            name="endsOn"
            type="date"
            defaultValue={event?.endsOn ?? ""}
            className={textInputClass}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Run by" htmlFor="branchId" hint="The branch that staffs and stocks the booth.">
          <select
            id="branchId"
            name="branchId"
            defaultValue={event?.branchId ?? BRANCH_LIST[0].id}
            className={textInputClass}
          >
            {BRANCH_LIST.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Organizer" htmlFor="organizer" optional>
          <input
            id="organizer"
            name="organizer"
            defaultValue={event?.organizer ?? ""}
            className={textInputClass}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Opening cash"
          htmlFor="openingCash"
          optional
          hint="The float in the till before the first sale, in pesos."
        >
          <input
            id="openingCash"
            name="openingCash"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            defaultValue={event?.openingCash ?? ""}
            placeholder="0"
            className={textInputClass}
          />
        </Field>
        <Field label="Cash note" htmlFor="cashNote" optional hint="For example, who holds the float.">
          <input
            id="cashNote"
            name="cashNote"
            defaultValue={event?.cashNote ?? ""}
            className={textInputClass}
          />
        </Field>
      </div>

      {state?.error && (
        <p role="alert" className="text-[14px] font-medium text-warn">
          {state.error}
        </p>
      )}

      <div>
        <SaveButton editing={Boolean(event)} />
      </div>
    </form>
  );
}

function SaveButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="pressable h-12 rounded-full bg-ink px-6 text-[15px] font-semibold text-paper transition-opacity disabled:opacity-60"
    >
      {pending ? "Saving" : editing ? "Save changes" : "Create event"}
    </button>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13.5px] font-medium text-ink">
        {label}
        {optional && <span className="ml-1.5 font-normal text-ink-faint">Optional</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-[12.5px] text-ink-faint">{hint}</p>}
    </div>
  );
}
