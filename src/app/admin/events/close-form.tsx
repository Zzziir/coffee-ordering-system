"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { textInputClass } from "@/components/text-input";
import { closeEventAction, type CloseEventState } from "./actions";

/** Count the till at the end of the bazaar and close it to new sales. */
export function CloseForm({ eventId, expected }: { eventId: string; expected: number }) {
  const [state, formAction] = useActionState<CloseEventState, FormData>(closeEventAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={eventId} />
      <div>
        <label htmlFor="closingCash" className="mb-1.5 block text-[13.5px] font-medium text-ink">
          Cash counted in the till
        </label>
        <input
          id="closingCash"
          name="closingCash"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          placeholder={String(expected)}
          className={textInputClass}
        />
        <p className="mt-1.5 text-[12.5px] text-ink-faint">
          Leave blank to close without a count. You can reopen the event later.
        </p>
      </div>
      {state?.error && (
        <p role="alert" className="text-[14px] font-medium text-warn">
          {state.error}
        </p>
      )}
      <div>
        <CloseButton />
      </div>
    </form>
  );
}

function CloseButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="pressable h-11 rounded-full bg-ink px-5 text-[14.5px] font-semibold text-paper transition-opacity disabled:opacity-60"
    >
      {pending ? "Closing" : "Close event"}
    </button>
  );
}
