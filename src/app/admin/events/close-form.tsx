"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { textInputClass } from "@/components/text-input";
import { useToast } from "@/components/toast";
import { peso } from "@/lib/menu";
import { closeEventAction, reopenEventAction } from "./actions";

/**
 * Count the till at the end of the bazaar and close it to new sales. Closing
 * stops the booth ringing anything up, so it asks first and spells out how the
 * count compares with what the till should hold.
 */
export function CloseForm({
  eventId,
  eventName,
  expected,
}: {
  eventId: string;
  eventName: string;
  expected: number;
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // The submitted form, held while the dialog asks. null means no dialog.
  const [asking, setAsking] = useState<FormData | null>(null);

  const raw = String(asking?.get("closingCash") ?? "").trim();
  const counted = raw === "" ? null : Number(raw);
  const variance = counted === null ? null : counted - expected;

  const close = () => {
    if (!asking) return;
    startTransition(async () => {
      const result = await closeEventAction(asking);
      setAsking(null);
      if (result?.error) {
        setError(result.error);
        return;
      }
      toast.success(`${eventName} is closed.`);
    });
  };

  return (
    <>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          setAsking(new FormData(e.currentTarget));
        }}
      >
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
            aria-describedby="closingCash-hint"
            className={textInputClass}
          />
          <p id="closingCash-hint" className="mt-1.5 text-[12.5px] text-ink-faint">
            Leave blank to close without a count. You can reopen the event later.
          </p>
        </div>
        {error && (
          <p role="alert" className="text-[14px] font-medium text-warn">
            {error}
          </p>
        )}
        <div>
          <button
            type="submit"
            className="pressable h-11 rounded-full bg-ink px-5 text-[14.5px] font-semibold text-paper"
          >
            Close event
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={asking !== null}
        title={`Close ${eventName}?`}
        confirmLabel="Close event"
        pendingLabel="Closing…"
        pending={pending}
        onConfirm={close}
        onCancel={() => setAsking(null)}
      >
        <p>
          {counted === null || variance === null
            ? "No cash count entered, so the till won't be checked."
            : variance === 0
              ? `You counted ${peso(counted)}, which matches the till exactly.`
              : `You counted ${peso(counted)} against ${peso(expected)} expected. That is ${peso(Math.abs(variance))} ${variance > 0 ? "over" : "short"}.`}
        </p>
        <p className="mt-2">No more sales can be rung up against it until you reopen it.</p>
      </ConfirmDialog>
    </>
  );
}

/** Undo a close. It asks first: reopening puts the event back on the till. */
export function ReopenButton({ eventId, eventName }: { eventId: string; eventName: string }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [asking, setAsking] = useState(false);

  const reopen = () =>
    startTransition(async () => {
      try {
        await reopenEventAction(eventId);
        toast.success(`${eventName} is open again.`);
      } catch {
        toast.error("Couldn't reopen the event. Try again.");
      }
      setAsking(false);
    });

  return (
    <>
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="pressable h-10 rounded-full border border-line-strong px-4 text-[14px] font-medium text-ink"
      >
        Reopen
      </button>
      <ConfirmDialog
        open={asking}
        title={`Reopen ${eventName}?`}
        confirmLabel="Reopen event"
        pendingLabel="Reopening…"
        pending={pending}
        onConfirm={reopen}
        onCancel={() => setAsking(false)}
      >
        Sales can be rung up against it again. The cash count stays as recorded until you close it
        with a new one.
      </ConfirmDialog>
    </>
  );
}
