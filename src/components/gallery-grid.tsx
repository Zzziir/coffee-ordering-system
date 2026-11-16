"use client";

import { useState } from "react";
import Image from "next/image";
import { XIcon } from "@phosphor-icons/react";
import { BlurFade } from "@/registry/magicui/blur-fade";
import { clsx } from "@/lib/clsx";
import { Sheet } from "./sheet";

export type GalleryPhoto = {
  src: string;
  alt: string;
  span: string;
  ratio: string;
};

/** Bento gallery whose tiles blur-fade in and expand into a lightbox on click. */
export function GalleryGrid({ photos }: { photos: GalleryPhoto[] }) {
  const [active, setActive] = useState<GalleryPhoto | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:auto-rows-[300px] lg:gap-4">
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
              className="pressable group relative block size-full overflow-hidden rounded-[var(--radius-md)]"
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="(max-width: 1024px) 50vw, 400px"
                // The first tile opens the page; the rest load as they scroll in.
                loading={i === 0 ? "eager" : "lazy"}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </button>
          </BlurFade>
        ))}
      </div>

      {/* Swipe the photo down, tap outside it, or press Escape to close. */}
      <Sheet
        open={active !== null}
        onClose={() => setActive(null)}
        label={active?.alt}
        placement="center"
        swipeToClose
        backdropClassName="bg-ink/80 backdrop-blur-sm"
        className="h-[85dvh] max-w-5xl"
      >
        {active && (
        <>
            <Image
              src={active.src}
              alt={active.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="rounded-[var(--radius-lg)] object-contain"
              loading="eager"
            />
            <button
              onClick={() => setActive(null)}
              aria-label="Close"
              className="pressable tap-44 absolute right-2 top-2 grid size-10 place-items-center rounded-full bg-paper text-ink shadow-[var(--shadow-sheet)]"
            >
              <XIcon size={20} weight="bold" />
            </button>
          </>
        )}
      </Sheet>
    </>
  );
}
