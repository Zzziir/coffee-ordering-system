import { motion, type Transition } from "motion/react";
import {
  StarIcon,
  PlusIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";
import { ItemThumb } from "@/components/item-thumb";
import { peso } from "@/lib/menu";

export type ProductCard = {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  signature: boolean;
  description: string | null;
  image?: string | null;
  action: "recommend" | "add";
  quantity?: number;
  added?: boolean;
};

type Handlers = {
  onAdd: (product: ProductCard) => void;
  onView: (id: string) => void;
  onViewBag: () => void;
};

// A soft, on-brand entrance. Cards appear just after the reply text, so a gentle
// rise reads as "here are your picks" without drawing attention to itself.
const EASE_OUT: Transition["ease"] = [0.23, 1, 0.32, 1];

/**
 * Renders the product picks under an assistant reply. One result is shown as a
 * roomy detail row; several become a horizontal "browse" carousel so the
 * customer can compare drinks side by side the way a menu rail feels.
 */
export function ChatProducts({
  products,
  reduce,
  ...handlers
}: Handlers & { products: ProductCard[]; reduce: boolean | null }) {
  if (products.length === 0) return null;
  if (products.length === 1) {
    return (
      <div className="mt-2 w-[85%] max-w-[320px]">
        <ProductRow product={products[0]} index={0} reduce={reduce} {...handlers} />
      </div>
    );
  }
  return (
    <div className="no-scrollbar mt-2.5 flex w-full snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1">
      {products.map((p, i) => (
        <ProductTile key={p.id + i} product={p} index={i} reduce={reduce} {...handlers} />
      ))}
    </div>
  );
}

function SignaturePill() {
  return (
    <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-ink shadow-[var(--shadow-card)]">
      <StarIcon size={9} weight="fill" />
      Signature
    </span>
  );
}

function entrance(index: number, reduce: boolean | null) {
  if (reduce) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.2, delay: index * 0.04 },
    };
  }
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: EASE_OUT, delay: index * 0.05 },
  };
}

/** The single-result card: thumbnail beside name, price, and actions. */
function ProductRow({
  product,
  index,
  reduce,
  onAdd,
  onView,
  onViewBag,
}: Handlers & { product: ProductCard; index: number; reduce: boolean | null }) {
  const added = product.added;
  return (
    <motion.div
      {...entrance(index, reduce)}
      className="flex gap-3 overflow-hidden rounded-[var(--radius-md)] border border-line bg-paper-raised p-3 shadow-[var(--shadow-card)]"
    >
      <div className="relative size-[76px] shrink-0 overflow-hidden rounded-[var(--radius-sm)]">
        <ItemThumb item={{ id: product.id, name: product.name, image: product.image ?? undefined }} iconClassName="size-8" sizes="76px" />
        {product.signature && <SignaturePill />}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h4 className="text-[14.5px] font-semibold leading-tight text-ink">{product.name}</h4>
        <p className="mt-0.5 text-[13px] font-medium text-coffee">
          {peso(product.price)}
          {added && product.quantity && product.quantity > 1 && (
            <span className="text-ink-soft"> · {product.quantity}×</span>
          )}
        </p>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-ink-soft">{product.description}</p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-2.5">
          {added ? (
            <>
              <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-ready">
                <CheckCircleIcon size={16} weight="fill" />
                In your bag
              </span>
              <button
                onClick={onViewBag}
                className="pressable ml-auto inline-flex h-9 items-center gap-1 rounded-full bg-ink px-3 text-[12.5px] font-semibold text-paper"
              >
                View bag
                <ArrowRightIcon size={13} weight="bold" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onView(product.id)}
                className="pressable h-9 rounded-full border border-line-strong px-3 text-[12.5px] font-medium text-ink"
              >
                View product
              </button>
              <button
                onClick={() => onAdd(product)}
                className="pressable inline-flex h-9 items-center gap-1 rounded-full bg-ink px-3 text-[12.5px] font-semibold text-paper"
              >
                <PlusIcon size={13} weight="bold" />
                Add
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/** The compare-and-browse card used when the barista suggests a few drinks. */
function ProductTile({
  product,
  index,
  reduce,
  onAdd,
  onView,
  onViewBag,
}: Handlers & { product: ProductCard; index: number; reduce: boolean | null }) {
  const added = product.added;
  return (
    <motion.div
      {...entrance(index, reduce)}
      className="flex w-[152px] shrink-0 snap-start flex-col overflow-hidden rounded-[var(--radius-md)] border border-line bg-paper-raised shadow-[var(--shadow-card)]"
    >
      <button
        onClick={() => onView(product.id)}
        aria-label={`View ${product.name}`}
        className="group relative block aspect-[5/4] w-full overflow-hidden"
      >
        <div className="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.06]">
          <ItemThumb item={{ id: product.id, name: product.name, image: product.image ?? undefined }} iconClassName="size-9" sizes="152px" />
        </div>
        {product.signature && <SignaturePill />}
      </button>

      <div className="flex min-w-0 flex-1 flex-col p-2.5">
        <h4 className="line-clamp-2 text-[13.5px] font-semibold leading-tight text-ink">{product.name}</h4>
        <p className="mt-1 text-[13px] font-medium text-coffee">{peso(product.price)}</p>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-ink-soft">{product.description}</p>
        )}

        <div className="mt-2.5">
          {added ? (
            <button
              onClick={onViewBag}
              className="pressable inline-flex h-9 w-full items-center justify-center gap-1 rounded-full bg-ready-tint px-3 text-[12px] font-semibold text-ready"
            >
              <CheckCircleIcon size={14} weight="fill" />
              In bag
            </button>
          ) : (
            <button
              onClick={() => onAdd(product)}
              className="pressable inline-flex h-9 w-full items-center justify-center gap-1 rounded-full bg-ink px-3 text-[12px] font-semibold text-paper"
            >
              <PlusIcon size={13} weight="bold" />
              Add to bag
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
