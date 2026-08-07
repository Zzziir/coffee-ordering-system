import Image from "next/image";
import { CupMark } from "./brand";
import { clsx } from "@/lib/clsx";
import type { MenuItem } from "@/lib/menu";

// Warm, on-brand placeholder tints. Chosen deterministically per item so a
// drink always shows the same one.
const TINTS = [
  "linear-gradient(150deg,#efe6d8,#d6bf9f)",
  "linear-gradient(150deg,#eae0cf,#c9a97f)",
  "linear-gradient(150deg,#ece3d3,#bfa079)",
  "linear-gradient(150deg,#e7d9c4,#caa06f)",
  "linear-gradient(150deg,#e8ded0,#cbb187)",
];

function tintFor(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return TINTS[sum % TINTS.length];
}

/**
 * Fills its (relatively-positioned) parent with the item's photo when one
 * exists, otherwise a warm branded placeholder. Set `item.image` later to swap
 * in real photography everywhere at once.
 */
export function ItemThumb({
  item,
  sizes = "(max-width: 1024px) 50vw, 380px",
  iconClassName = "size-1/3",
}: {
  item: Pick<MenuItem, "id" | "name" | "image">;
  sizes?: string;
  iconClassName?: string;
}) {
  if (item.image) {
    return (
      <Image src={item.image} alt={item.name} fill sizes={sizes} className="object-cover" />
    );
  }
  return (
    <div
      className="absolute inset-0 grid place-items-center"
      style={{ background: tintFor(item.id) }}
      aria-hidden
    >
      <CupMark className={clsx("text-ink/20", iconClassName)} />
    </div>
  );
}
