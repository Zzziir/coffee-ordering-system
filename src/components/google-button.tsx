"use client";

import { useFormStatus } from "react-dom";

/**
 * "Continue with Google", shared by the customer and staff sign-in pages, with
 * the "or" rule that separates it from the email form below. `action` is the
 * Server Action that starts the hop for that kind of account.
 */
export function GoogleButton({
  action,
  next,
}: {
  action: (formData: FormData) => Promise<void>;
  next: string | null;
}) {
  return (
    <>
      <form action={action} className="mt-8">
        {next && <input type="hidden" name="next" value={next} />}
        <SubmitButton />
      </form>

      <div
        role="separator"
        className="mt-6 flex items-center gap-3 text-[13px] text-ink-faint"
      >
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="pressable flex h-14 w-full items-center justify-center gap-3 rounded-full border border-line-strong bg-paper-raised text-[16px] font-semibold text-ink disabled:opacity-70"
    >
      <GoogleMark />
      {pending ? "Opening Google…" : "Continue with Google"}
    </button>
  );
}

/** Google's "G". Its four colours are fixed by Google's brand rules. */
function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="h-[18px] w-[18px]">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
