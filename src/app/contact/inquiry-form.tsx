"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { textInputClass } from "@/components/text-input";
import { submitInquiry, type InquiryState } from "./actions";
import type { InquiryKind } from "@/lib/inquiries";

const KINDS: { value: InquiryKind; label: string }[] = [
  { value: "franchise", label: "Franchising" },
  { value: "event", label: "Events & carts" },
];

const EVENT_TYPES = ["Wedding", "Debut", "Corporate event", "Birthday", "Other"];

const textareaClass = `${textInputClass.replace("h-12", "min-h-[104px] py-3")} resize-none leading-relaxed`;

export function InquiryForm() {
  const [state, formAction] = useActionState<InquiryState, FormData>(submitInquiry, null);
  const [kind, setKind] = useState<InquiryKind>("franchise");
  const reduce = useReducedMotion();

  if (state && "ok" in state) {
    return <SuccessPanel reduce={reduce} />;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="kind" value={kind} />

      {/* Honeypot: off-screen, never seen or tabbed to by a human. */}
      <div aria-hidden className="pointer-events-none absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <KindToggle kind={kind} onChange={setKind} reduce={reduce} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="name">
          <input id="name" name="name" required autoComplete="name" className={textInputClass} />
        </Field>
        <Field label="Mobile number" htmlFor="phone" optional>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="09xx xxx xxxx"
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

      {/* The fields that differ by intent. Keyed by kind so switching
          cross-fades them; height follows content via layout. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={kind}
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-col gap-4"
        >
          {kind === "franchise" ? <FranchiseFields /> : <EventFields />}
        </motion.div>
      </AnimatePresence>

      <Field label={kind === "franchise" ? "Anything else?" : "Tell us about your event"} htmlFor="message" optional>
        <textarea
          id="message"
          name="message"
          rows={3}
          placeholder={
            kind === "franchise"
              ? "Your background, budget range, questions…"
              : "Theme, timing, drinks you have in mind…"
          }
          className={textareaClass}
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

      <p className="text-center text-[13px] leading-relaxed text-ink-faint">
        We&apos;ll only use your details to reply about your inquiry.
      </p>
    </form>
  );
}

function FranchiseFields() {
  return (
    <>
      <Field label="Preferred area or city" htmlFor="preferredArea" optional>
        <input
          id="preferredArea"
          name="preferredArea"
          placeholder="e.g. Makati, Marilao, elsewhere in Metro Manila"
          className={textInputClass}
        />
      </Field>
      <Field label="Timeline" htmlFor="timeline" optional>
        <input
          id="timeline"
          name="timeline"
          placeholder="e.g. exploring, or ready within 6 months"
          className={textInputClass}
        />
      </Field>
    </>
  );
}

function EventFields() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Event type" htmlFor="eventType" optional>
          <select id="eventType" name="eventType" defaultValue="" className={`${textInputClass} appearance-none`}>
            <option value="" disabled>
              Choose one
            </option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Event date" htmlFor="eventDate" optional>
          <input id="eventDate" name="eventDate" type="date" className={textInputClass} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Venue or area" htmlFor="venue" optional>
          <input id="venue" name="venue" placeholder="Where's it happening?" className={textInputClass} />
        </Field>
        <Field label="Estimated guests" htmlFor="guestCount" optional>
          <input
            id="guestCount"
            name="guestCount"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="e.g. 120"
            className={textInputClass}
          />
        </Field>
      </div>
    </>
  );
}

/** Segmented control for the inquiry intent, with a sliding active pill. */
function KindToggle({
  kind,
  onChange,
  reduce,
}: {
  kind: InquiryKind;
  onChange: (k: InquiryKind) => void;
  reduce: boolean | null;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="What are you interested in?"
      className="grid grid-cols-2 gap-1 rounded-full border border-line bg-paper-sunk p-1"
    >
      {KINDS.map((k) => {
        const active = k.value === kind;
        return (
          <button
            key={k.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(k.value)}
            className="pressable relative isolate flex h-11 items-center justify-center rounded-full text-[14.5px] font-medium"
          >
            {active && (
              <motion.span
                layoutId="inquiry-kind-pill"
                transition={
                  reduce ? { duration: 0 } : { type: "spring", duration: 0.4, bounce: 0.15 }
                }
                className="absolute inset-0 -z-10 rounded-full bg-ink shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
              />
            )}
            <span className={active ? "text-paper" : "text-ink-soft"}>{k.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="pressable mt-1 flex h-14 w-full items-center justify-center rounded-full bg-ink text-[16px] font-semibold text-paper transition-opacity disabled:opacity-70"
    >
      {pending ? "Sending…" : "Send inquiry"}
    </button>
  );
}

function SuccessPanel({ reduce }: { reduce: boolean | null }) {
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-center rounded-[var(--radius-lg)] border border-line bg-paper-raised px-6 py-12 text-center"
    >
      <span className="grid size-14 place-items-center rounded-full bg-ready/12 text-ready">
        <CheckCircleIcon size={30} weight="fill" />
      </span>
      <h3 className="mt-5 text-[20px] font-semibold text-ink">Thanks, we&apos;ve got it.</h3>
      <p className="mt-2 max-w-[38ch] text-[15px] leading-relaxed text-ink-soft">
        We&apos;ll reach out by email soon. For anything urgent, message us on Facebook or
        Instagram and mention your inquiry.
      </p>
    </motion.div>
  );
}

/** Local label + field wrapper, mirroring the account forms without coupling to them. */
function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="flex items-center gap-2 text-[14px] font-medium text-ink">
        {label}
        {optional && <span className="text-[12px] font-normal text-ink-faint">Optional</span>}
      </label>
      {children}
    </div>
  );
}
