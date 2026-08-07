"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CupMark } from "@/components/brand";
import { BranchLockup } from "@/components/branch-lockup";
import { branchAddress, type Branch } from "@/lib/branches";

/**
 * The printable table tent for one branch. The code carries `?b=<branch>`, so
 * scanning it at MYCC puts the order on MYCC's queue without anyone choosing.
 */
export function QrCard({ branch }: { branch: Branch }) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [target, setTarget] = useState<string>("");

  useEffect(() => {
    const url = `${window.location.origin}/menu?b=${branch.id}`;
    setTarget(url);
    QRCode.toDataURL(url, {
      margin: 1,
      width: 720,
      color: { dark: "#2b2a28", light: "#00000000" },
      errorCorrectionLevel: "M",
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(""));
  }, [branch.id]);

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-paper px-5 py-10">
      <div className="w-full max-w-sm rounded-[var(--radius-xl)] border border-line bg-paper-raised p-8 text-center shadow-[var(--shadow-card)]">
        <div className="flex flex-col items-center gap-3">
          <span className="grid size-12 place-items-center rounded-full bg-ink text-paper">
            <CupMark className="size-6" />
          </span>
          <BranchLockup branch={branch} className="h-7 text-xl text-ink" />
        </div>

        <h1 className="mt-6 text-[26px] font-bold leading-tight tracking-tight text-ink">
          Scan to order
        </h1>
        <p className="mx-auto mt-1.5 max-w-[26ch] text-[15px] leading-relaxed text-ink-soft">
          Skip the line. Order and pay from your phone, pick up at the{" "}
          {branch.pickupNoun}.
        </p>

        <div className="mx-auto mt-6 grid aspect-square w-full max-w-[280px] place-items-center rounded-[var(--radius-lg)] border border-line bg-paper p-4">
          {dataUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={dataUrl} alt={`QR code linking to ${target}`} className="size-full" />
          ) : (
            <span className="size-8 animate-spin rounded-full border-[3px] border-line border-t-coffee" />
          )}
        </div>

        <p className="mt-5 text-[13px] font-medium uppercase tracking-[0.14em] text-coffee">
          Pay ahead · Pick up fast
        </p>
        <p className="mt-2 text-[12.5px] text-ink-faint">{branchAddress(branch)}</p>
      </div>

      <button
        onClick={() => window.print()}
        className="pressable mt-6 rounded-full border border-line-strong px-5 py-2.5 text-[14px] font-medium text-ink print:hidden"
      >
        Print this
      </button>
    </div>
  );
}
