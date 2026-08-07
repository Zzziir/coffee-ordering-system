"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ChatCircleDotsIcon,
  XIcon,
  PaperPlaneRightIcon,
  CheckCircleIcon,
  PlusIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";
import { CupMark } from "@/components/brand";
import { ItemThumb } from "@/components/item-thumb";
import { useCart } from "@/components/cart-provider";
import { peso } from "@/lib/menu";
import { clsx } from "@/lib/clsx";

type ProductCard = {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  signature: boolean;
  description: string | null;
  action: "recommend" | "add";
  quantity?: number;
  added?: boolean;
};

type Msg = { role: "user" | "model"; text: string; products?: ProductCard[] };

const SUGGESTIONS = [
  "What's your bestseller?",
  "Something not too sweet",
  "Dairy-free under ₱100",
  "Add a Spanish Latte to my cart",
];

export function ChatLauncher() {
  const router = useRouter();
  const { addLine } = useCart();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const reduce = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const addProductToCart = (p: ProductCard) => {
    addLine({
      itemId: p.id,
      name: p.name,
      basePrice: p.price,
      qty: p.quantity && p.quantity > 0 ? p.quantity : 1,
      groups: [],
    });
  };

  const markAdded = (msgIndex: number, productId: string) => {
    setMessages((prev) =>
      prev.map((m, i) =>
        i === msgIndex && m.products
          ? { ...m, products: m.products.map((p) => (p.id === productId ? { ...p, added: true } : p)) }
          : m,
      ),
    );
  };

  const goToProduct = (id: string) => {
    setOpen(false);
    router.push(`/menu?item=${id}`);
  };

  const goToBag = () => {
    setOpen(false);
    router.push("/cart");
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");
    const history: Msg[] = [...messages, { role: "user", text: trimmed }];
    setMessages([...history, { role: "model", text: "" }]);
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map((m) => ({ role: m.role, text: m.text })) }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "model", text: data.error || "Sorry, I couldn't reply just now. Try again?" };
          return next;
        });
        return;
      }

      const products: ProductCard[] = Array.isArray(data.products) ? data.products : [];
      // Auto-add anything the bot was told to add; mark those cards as added.
      const finalized = products.map((p) => {
        if (p.action === "add") {
          addProductToCart(p);
          return { ...p, added: true };
        }
        return p;
      });

      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "model", text: data.reply || "", products: finalized };
        return next;
      });
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "model", text: "Nawalan ng signal. Try again?" };
        return next;
      });
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Ask Craffé"
        className="pressable fixed bottom-5 right-5 z-40 flex h-14 items-center gap-2 rounded-full bg-coffee pl-4 pr-5 text-paper shadow-[var(--shadow-pop)]"
      >
        <ChatCircleDotsIcon size={24} weight="fill" />
        <span className="text-[15px] font-semibold">Ask Craffé</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col justify-end sm:items-end sm:p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            />

            <motion.div
              role="dialog"
              aria-label="Ask Craffé chat"
              className="relative flex h-[85dvh] w-full max-w-2xl flex-col rounded-t-[var(--radius-xl)] bg-paper shadow-[var(--shadow-sheet)] sm:mx-auto sm:h-[600px] sm:max-h-[85dvh] sm:max-w-[440px] sm:rounded-[var(--radius-xl)]"
              initial={reduce ? { opacity: 0 } : { y: "100%" }}
              animate={reduce ? { opacity: 1 } : { y: 0 }}
              exit={reduce ? { opacity: 0 } : { y: "100%" }}
              transition={{ duration: 0.42, ease: [0.32, 0.72, 0, 1] }}
            >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-ink text-paper">
                    <CupMark className="size-5" />
                  </span>
                  <div>
                    <p className="text-[16px] font-semibold leading-tight text-ink">Ask Craffé</p>
                    <p className="text-[13px] text-ink-soft">Your menu buddy</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="pressable grid size-9 place-items-center rounded-full text-ink-soft hover:bg-paper-sunk"
                >
                  <XIcon size={20} weight="bold" />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                    <span className="grid size-14 place-items-center rounded-full bg-coffee-tint text-coffee">
                      <ChatCircleDotsIcon size={28} weight="fill" />
                    </span>
                    <p className="mt-4 text-[16px] font-semibold text-ink">
                      Hi! Ano&apos;ng craving mo today? ☕
                    </p>
                    <p className="mt-1 max-w-[30ch] text-[14px] leading-relaxed text-ink-soft">
                      Ask for a recommendation, or tell me to add something to your bag.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => send(s)}
                          className="pressable rounded-full border border-line-strong bg-paper-raised px-3.5 py-2 text-[13.5px] font-medium text-ink"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={clsx("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
                      {(m.text || m.role === "user" || !m.products?.length) && (
                        <div
                          className={clsx(
                            "max-w-[85%] whitespace-pre-wrap rounded-[var(--radius-md)] px-4 py-2.5 text-[15px] leading-relaxed",
                            m.role === "user"
                              ? "rounded-br-md bg-ink text-paper"
                              : "rounded-bl-md border border-line bg-paper-raised text-ink",
                          )}
                        >
                          {m.text || (
                            <span className="inline-flex gap-1 py-1">
                              <Dot /> <Dot delay={0.15} /> <Dot delay={0.3} />
                            </span>
                          )}
                        </div>
                      )}

                      {/* Product cards */}
                      {m.products?.map((p, pi) => (
                        <ChatProduct
                          key={p.id + pi}
                          product={p}
                          onAdd={() => {
                            addProductToCart(p);
                            markAdded(i, p.id);
                          }}
                          onView={() => goToProduct(p.id)}
                          onViewBag={goToBag}
                        />
                      ))}
                    </div>
                  ))
                )}
              </div>

              {/* Composer */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex shrink-0 items-center gap-2 border-t border-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message Craffé…"
                  className="h-12 flex-1 rounded-full border border-line bg-paper-raised px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-coffee"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || busy}
                  aria-label="Send"
                  className="pressable grid size-12 shrink-0 place-items-center rounded-full bg-ink text-paper transition-opacity disabled:opacity-40"
                >
                  <PaperPlaneRightIcon size={20} weight="fill" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ChatProduct({
  product,
  onAdd,
  onView,
  onViewBag,
}: {
  product: ProductCard;
  onAdd: () => void;
  onView: () => void;
  onViewBag: () => void;
}) {
  const added = product.added;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="mt-2 flex w-[85%] max-w-[320px] gap-3 overflow-hidden rounded-[var(--radius-md)] border border-line bg-paper-raised p-3"
    >
      {/* Thumbnail */}
      <div className="relative size-[76px] shrink-0 overflow-hidden rounded-[var(--radius-sm)]">
        <ItemThumb item={{ id: product.id, name: product.name }} iconClassName="size-8" sizes="76px" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-1.5">
          <h4 className="text-[14.5px] font-semibold leading-tight text-ink">{product.name}</h4>
        </div>
        <p className="mt-0.5 text-[13px] text-ink-soft">
          {peso(product.price)}
          {product.signature && <span className="text-coffee"> · Signature</span>}
          {added && product.quantity && product.quantity > 1 && (
            <span> · {product.quantity}×</span>
          )}
        </p>

        <div className="mt-auto flex items-center gap-2 pt-2.5">
          {added ? (
            <>
              <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-ready">
                <CheckCircleIcon size={16} weight="fill" />
                In your bag
              </span>
              <button
                onClick={onViewBag}
                className="pressable ml-auto inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-[12.5px] font-semibold text-paper"
              >
                View bag
                <ArrowRightIcon size={13} weight="bold" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onView}
                className="pressable rounded-full border border-line-strong px-3 py-1.5 text-[12.5px] font-medium text-ink"
              >
                View product
              </button>
              <button
                onClick={onAdd}
                className="pressable inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-[12.5px] font-semibold text-paper"
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

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <motion.span
      className="inline-block size-2 rounded-full bg-ink-faint"
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}
