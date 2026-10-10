"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckCircleIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";

/**
 * Short confirmations that an action went through, or didn't. They sit at the
 * bottom of the dashboard, out of the way of the work, and leave on their own:
 * a toast never holds anything the user has to act on. Errors stay longer and
 * are announced assertively; successes are announced politely.
 */

type Tone = "success" | "error";
type Toast = { id: number; tone: Tone; message: string };

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const SUCCESS_MS = 4000;
const ERROR_MS = 7000;
// Older toasts drop off so a burst of actions never stacks up the screen.
const MAX_VISIBLE = 3;

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be used inside a ToastProvider.");
  return api;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const reduce = useReducedMotion();

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (tone: Tone, message: string) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, tone, message }].slice(-MAX_VISIBLE));
      setTimeout(() => dismiss(id), tone === "error" ? ERROR_MS : SUCCESS_MS);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => show("success", message),
      error: (message) => show("error", message),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:items-end sm:px-6"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout={!reduce}
              role={toast.tone === "error" ? "alert" : "status"}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-[var(--radius-md)] bg-ink py-2.5 pl-3.5 pr-1.5 text-paper shadow-[var(--shadow-pop)]"
            >
              {toast.tone === "error" ? (
                <WarningCircleIcon size={20} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
              ) : (
                <CheckCircleIcon size={20} weight="fill" className="mt-0.5 shrink-0" aria-hidden />
              )}
              <p className="min-w-0 flex-1 py-0.5 text-[14px] font-medium leading-snug">
                {toast.tone === "error" && <span className="sr-only">Error: </span>}
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
                className="pressable grid size-8 shrink-0 place-items-center rounded-full text-paper/70 hover:text-paper"
              >
                <XIcon size={15} weight="bold" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
