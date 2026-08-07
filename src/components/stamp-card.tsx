"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CoffeeIcon, GiftIcon } from "@phosphor-icons/react";
import { CupMark } from "./brand";
import { clsx } from "@/lib/clsx";

const STAMP_KEY = "craffe.stamps";
const GOAL = 9;

/** Digital "buy 9, get 1 free" card. Reads the local stamp count. */
export function StampCard() {
  const [stamps, setStamps] = useState<number | null>(null);

  useEffect(() => {
    const read = () => {
      try {
        setStamps(Number(localStorage.getItem(STAMP_KEY) || "0"));
      } catch {
        setStamps(0);
      }
    };
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, []);

  const filled = stamps ?? 0;
  const earned = Math.floor(filled / (GOAL + 1)); // free drinks unlocked
  const progress = filled % (GOAL + 1);
  const remaining = GOAL - progress;
  const rewardReady = progress === GOAL;

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-ink text-paper">
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2">
          <CupMark className="size-5 text-paper" />
          <span className="text-[14px] font-semibold tracking-wide">
            Craffé Rewards
          </span>
        </div>
        {earned > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-paper/15 px-2.5 py-1 text-[12px] font-medium">
            <GiftIcon size={13} weight="fill" />
            {earned} free
          </span>
        )}
      </div>

      <p className="px-5 pt-2 text-[13.5px] text-paper/70">
        {rewardReady
          ? "You've earned a free drink! Claim it on your next order."
          : `${remaining} more ${remaining === 1 ? "drink" : "drinks"} until a free one.`}
      </p>

      <div className="grid grid-cols-5 gap-2.5 p-5">
        {Array.from({ length: GOAL + 1 }).map((_, i) => {
          const isReward = i === GOAL;
          const active = i < progress || (rewardReady && isReward);
          return (
            <div
              key={i}
              className={clsx(
                "relative grid aspect-square place-items-center rounded-full border transition-colors duration-300",
                isReward ? "border-dashed" : "",
                active
                  ? "border-transparent bg-coffee text-paper"
                  : "border-paper/25 text-paper/30",
              )}
            >
              {active && stamps !== null ? (
                <motion.span
                  initial={i === progress - 1 ? { scale: 0.4, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                >
                  {isReward ? <GiftIcon size={18} weight="fill" /> : <CoffeeIcon size={18} weight="fill" />}
                </motion.span>
              ) : isReward ? (
                <GiftIcon size={18} weight="regular" />
              ) : (
                <CoffeeIcon size={16} weight="regular" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
