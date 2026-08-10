"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { XIcon } from "@phosphor-icons/react";
import { BlurFade } from "@/registry/magicui/blur-fade";
import { clsx } from "@/lib/clsx";

export type GalleryPhoto = {
  src: string;
  alt: string;
  span: string;
  ratio: string;
};

/** Bento gallery whose tiles blur-fade in and expand into a lightbox on click. */
export function GalleryGrid({ photos }: { photos: GalleryPhoto[] }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<GalleryPhoto | null>(null);

  // Lock body scroll and close on Escape while the lightbox is open.
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [active]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        {photos.map((p, i) => (
          <BlurFade
            key={p.src + i}
            delay={(i % 3) * 0.06}
            inView
            className={clsx(p.span, p.ratio)}
          >
            <button
              type="button"
              onClick={() => setActive(p)}
              aria-label={`Expand photo: ${p.alt}`}
              className="group relative block size-full overflow-hidden rounded-[var(--radius-md)]"
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="(max-width: 1024px) 50vw, 400px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </button>
          </BlurFade>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <button
              aria-label="Close"
              onClick={() => setActive(null)}
              className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
            />

            {/* Expanded image */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={active.alt}
              className="relative h-[85dvh] w-full max-w-5xl"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image
                src={active.src}
                alt={active.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="rounded-[var(--radius-lg)] object-contain"
                priority
              />
              <button
                onClick={() => setActive(null)}
                aria-label="Close"
                className="pressable absolute right-2 top-2 grid size-10 place-items-center rounded-full bg-paper text-ink shadow-[var(--shadow-sheet)]"
              >
                <XIcon size={20} weight="bold" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
