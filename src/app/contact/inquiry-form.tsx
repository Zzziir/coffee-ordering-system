"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CheckCircleIcon,
  HandshakeIcon,
  ConfettiIcon,
  ArrowRightIcon,
  CaretLeftIcon,
} from "@phosphor-icons/react";
import { textInputClass } from "@/components/text-input";
import { submitInquiry, type InquiryState } from "./actions";
import type { InquiryKind } from "@/lib/inquiries";

type Intent = {
  value: InquiryKind;
  label: string;
  tagline: string;
  icon: typeof HandshakeIcon;
};

const INTENTS: Intent[] = [
  {
    value: "franchise",
    label: "Franchising",
    tagline: "Open your own Craffé branch.",
    icon: HandshakeIcon,
  },
  {
    value: "event",
    label: "Events & carts",
    tagline: "A coffee cart for your celebration.",
    icon: ConfettiIcon,
  },
];

const EVENT_TYPES = ["Wedding", "Debut", "Corporate event", "Birthday", "Other"];

const textareaClass = `${textInputClass.replace("h-12", "min-h-[104px] py-3")} resize-none leading-relaxed`;

export function InquiryForm() {
  const [state, formAction] = useActionState<InquiryState, FormData>(submitInquiry, null);
  // Hick's Law: don't open with a wall of fields. The first ask is one small
  // choice; the form for that path only appears once they've picked.
  const [kind, setKind] = useState<InquiryKind | null>(null);
  const reduce = useReducedMotion();

  if (state && "ok" in state) {
    return <SuccessPanel reduce={reduce} />;
  }

  if (!kind) {
    return <IntentChooser onChoose={setKind} reduce={reduce} />;
  }

  const intent = INTENTS.find((i) => i.value === kind)!;

  return (
    <motion.form
      action={formAction}
      className="flex flex-col gap-4"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
    >
      <input type="hidden" name="kind" value={kind} />

      {/* Honeypot: off-screen, never seen or tabbed to by a human. */}
      <div aria-hidden className="pointer-events-none absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <ChosenIntent intent={intent} onChange={() => setKind(null)} />

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

      {kind === "franchise" ? <FranchiseFields /> : <EventFields />}

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
    </motion.form>
  );
}

/** Step one: a single, low-commitment choice instead of a full form. */
function IntentChooser({
  onChoose,
  reduce,
}: {
  onChoose: (k: InquiryKind) => void;
  reduce: boolean | null;
}) {
  return (
    <motion.div
      className="flex flex-col gap-3"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
    >
      {INTENTS.map((intent, i) => {
        const Icon = intent.icon;
        return (
          <motion.button
            key={intent.value}
            type="button"
            onClick={() => onChoose(intent.value)}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1], delay: 0.05 + i * 0.06 }}
            className="group flex items-center gap-4 rounded-[var(--radius-lg)] border border-line bg-paper p-4 text-left transition-all duration-200 hover:border-coffee/40 hover:bg-paper-raised hover:shadow-[var(--shadow-card)]"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-[var(--radius-md)] bg-gradient-to-br from-coffee to-coffee-deep text-paper shadow-[var(--shadow-card)] transition-transform duration-200 group-hover:scale-105">
              <Icon size={23} weight="fill" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15.5px] font-semibold text-ink">{intent.label}</span>
              <span className="mt-0.5 block text-[13.5px] text-ink-soft">{intent.tagline}</span>
            </span>
            <ArrowRightIcon
              size={18}
              weight="bold"
              className="shrink-0 text-ink-faint transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-coffee"
            />
          </motion.button>
        );
      })}
      <p className="mt-1 text-center text-[13px] leading-relaxed text-ink-faint">
        Pick one and we&apos;ll ask for just a few details.
      </p>
    </motion.div>
  );
}

/** The chosen path, with a way back to the one-tap chooser. */
function ChosenIntent({ intent, onChange }: { intent: Intent; onChange: () => void }) {
  const Icon = intent.icon;
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-line bg-paper-sunk/60 py-2 pl-2 pr-3">
      <span className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-gradient-to-br from-coffee to-coffee-deep text-paper">
          <Icon size={18} weight="fill" />
        </span>
        <span className="text-[14.5px] font-semibold text-ink">{intent.label}</span>
      </span>
      <button
        type="button"
        onClick={onChange}
        className="pressable inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[13px] font-medium text-coffee hover:bg-coffee/5"
      >
        <CaretLeftIcon size={13} weight="bold" />
        Change
      </button>
    </div>
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
