"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ExportIcon, XIcon } from "@phosphor-icons/react";
import { clsx } from "@/lib/clsx";

const DISMISSED_KEY = "craffe.install.dismissed.v1";

/** Chromium's install event. Not in lib.dom, so typed here. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Mode = "hidden" | "prompt" | "ios";

/**
 * A quiet invitation to put Craffé on the home screen.
 *
 * Chromium browsers hand us an install event, so the card gets a real Install
 * button. iOS Safari has no such event and never will, so there the card
 * explains the Share menu route instead. It renders nothing when the app is
 * already installed, when the browser can't install it, or once dismissed.
 */
export function InstallPrompt({ className }: { className?: string }) {
  const [mode, setMode] = useState<Mode>("hidden");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari's own flag for a home screen launch.
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
    } catch {
      /* storage blocked: just show it this visit */
    }

    const ua = navigator.userAgent;
    // iPadOS reports itself as a Mac, so check for touch as well.
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    // Only Safari can add to the home screen from the Share menu on iOS.
    const isSafari = !/CriOS|FxiOS|EdgiOS/.test(ua);
    if (isIOS && isSafari) setMode("ios");

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setMode("prompt");
    };
    const onInstalled = () => setMode("hidden");

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (mode === "hidden") return null;

  const dismiss = () => {
    setMode("hidden");
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* storage blocked: it stays hidden for this visit only */
    }
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    // The event is single use either way.
    setInstallEvent(null);
    if (outcome === "accepted") setMode("hidden");
  };

  return (
    <aside
      aria-label="Install Craffé"
      className={clsx(
        "flex items-center gap-3 rounded-[var(--radius-md)] border border-line bg-paper-raised p-3",
        className,
      )}
    >
      <Image
        src="/icons/icon-192.png"
        alt=""
        width={44}
        height={44}
        className="size-11 shrink-0 rounded-[var(--radius-sm)]"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold leading-tight text-ink">
          Add Craffé to your home screen
        </p>
        <p className="mt-0.5 text-[13.5px] leading-snug text-ink-soft">
          {mode === "ios" ? (
            <>
              Tap <ExportIcon size={15} weight="bold" className="inline -translate-y-px" aria-label="Share" />{" "}
              then Add to Home Screen.
            </>
          ) : (
            "Order and track your drinks in one tap."
          )}
        </p>
      </div>
      {mode === "prompt" && (
        <button
          type="button"
          onClick={install}
          className="pressable h-11 shrink-0 rounded-full bg-ink px-4 text-[14px] font-semibold text-paper"
        >
          Install
        </button>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Not now"
        className="pressable -mr-1.5 grid size-11 shrink-0 place-items-center rounded-full text-ink-faint hover:text-ink"
      >
        <XIcon size={18} weight="bold" />
      </button>
    </aside>
  );
}
