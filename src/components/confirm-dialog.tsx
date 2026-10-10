"use client";

import { useEffect, useId, useRef } from "react";

/**
 * Asks before an action that is hard to take back or easy to trigger by
 * accident. Built on the native <dialog>, which traps focus, closes on Escape
 * and makes the page behind it inert without any extra code.
 *
 * The confirm button names the action ("Close event"), never a bare "OK".
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  pendingLabel,
  cancelLabel = "Cancel",
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  /** What will happen, in a sentence or two. */
  children: React.ReactNode;
  confirmLabel: string;
  /** Shown on the confirm button while the action runs. */
  pendingLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      // Escape: let the caller decide, and never drop a running action.
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onCancel();
      }}
      // A click that lands on the dialog itself is a click on the backdrop.
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) onCancel();
      }}
      className="m-auto w-[calc(100%-2.5rem)] max-w-sm rounded-[var(--radius-lg)] border border-line bg-paper-raised p-0 text-ink shadow-[var(--shadow-pop)] transition-[opacity,scale] duration-200 ease-[var(--ease-out)] backdrop:bg-black/50 motion-reduce:transition-none starting:open:scale-95 starting:open:opacity-0"
    >
      <div className="p-5 sm:p-6">
        <h2 id={titleId} className="text-[18px] font-bold leading-snug tracking-tight text-ink">
          {title}
        </h2>
        <div id={bodyId} className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
          {children}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="pressable h-11 rounded-full border border-line-strong px-5 text-[14.5px] font-medium text-ink disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            autoFocus
            className="pressable h-11 rounded-full bg-ink px-5 text-[14.5px] font-semibold text-paper transition-opacity disabled:opacity-60"
          >
            {pending && pendingLabel ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
