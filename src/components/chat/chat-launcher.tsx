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
  CaretLeftIcon,
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

// The greeting card is shown once per browser session, not on every page.
const TEASER_SEEN_KEY = "craffe.chat.teaser.v1";
const TEASER_DELAY_MS = 1500;
// Matches Tailwind's `sm`: below it the chat is a full-screen page, from it up
// a small window anchored above the launcher.
const WINDOW_QUERY = "(min-width: 640px)";

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
  const [teaser, setTeaser] = useState(false);
  const [windowed, setWindowed] = useState(false);
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
    // The chat covers the whole screen on a phone, so the page behind it must
    // not scroll under the keyboard. The desktop window leaves the page live.
    const prevOverflow = document.body.style.overflow;
    if (!windowed) document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, windowed]);

  // Greet a moment after the page settles, so the card doesn't compete with
  // the page's own entrance.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(TEASER_SEEN_KEY)) return;
    } catch {
      /* storage blocked: greet anyway */
    }
    const timer = setTimeout(() => setTeaser(true), TEASER_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismissTeaser = () => {
    setTeaser(false);
    try {
      sessionStorage.setItem(TEASER_SEEN_KEY, "1");
    } catch {
      /* storage blocked: it stays dismissed for this page only */
    }
  };

  const openChat = () => {
    dismissTeaser();
    setWindowed(window.matchMedia(WINDOW_QUERY).matches);
    setOpen(true);
  };

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
      <div className="fixed bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+0.75rem)] right-4 z-40 flex flex-col items-end gap-3 lg:bottom-5 lg:right-5">
        {/* Greeting card. Larger screens only: on a phone it would cover the
            page, and the launcher alone is enough there. */}
        <AnimatePresence>
          {teaser && !open && (
            <motion.aside
              aria-label="Ask Craffé"
              className="hidden w-[300px] origin-bottom-right overflow-hidden rounded-[var(--radius-lg)] border border-line bg-paper-raised shadow-[var(--shadow-pop)] sm:block"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="flex items-center gap-3 bg-ink py-3 pl-4 pr-3 text-paper">
                <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-paper text-ink">
                  <CupMark className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15.5px] font-semibold leading-tight">Ask Craffé</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-paper/70">
                    <span className="size-2 rounded-full bg-[#6fc48b]" />
                    Your menu buddy
                  </p>
                </div>
                <button
                  onClick={dismissTeaser}
                  aria-label="Dismiss"
                  className="pressable grid size-9 shrink-0 place-items-center rounded-full bg-paper/10 text-paper/80 transition-colors duration-150 hover:bg-paper/20 hover:text-paper"
                >
                  <XIcon size={16} weight="bold" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-[17px] font-bold leading-snug tracking-tight text-ink">
                  Not sure what to order?
                </p>
                <p className="mt-1 text-[14.5px] leading-relaxed text-ink-soft">
                  Tell me your craving and I&apos;ll find your drink.
                </p>
                <button
                  onClick={openChat}
                  className="pressable mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-ink pl-4 pr-3.5 text-[14.5px] font-semibold text-paper"
                >
                  Let&apos;s chat
                  <ArrowRightIcon size={16} weight="bold" />
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <button
          onClick={openChat}
          aria-label="Ask Craffé"
          className="pressable relative grid size-14 place-items-center rounded-full bg-coffee text-paper shadow-[var(--shadow-pop)]"
        >
          <ChatCircleDotsIcon size={26} weight="fill" />
          {/* Unread dot that pairs with the greeting card. */}
          {teaser && (
            <span
              aria-hidden
              className="absolute -right-0.5 -top-0.5 hidden min-w-5 place-items-center rounded-full bg-warn px-1 text-[11px] font-bold leading-5 text-paper-raised ring-2 ring-paper sm:grid"
            >
              1
            </span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col justify-end sm:items-end sm:px-4 sm:pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+5.25rem)] lg:px-5 lg:pb-[5.75rem]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none"
            />

            <motion.div
              role="dialog"
              aria-label="Ask Craffé chat"
              className="relative flex h-[100dvh] w-full origin-bottom-right flex-col overflow-hidden bg-paper shadow-[var(--shadow-sheet)] sm:h-[560px] sm:max-h-full sm:max-w-[400px] sm:rounded-[var(--radius-lg)] sm:border sm:border-line sm:shadow-[var(--shadow-pop)]"
              // The phone page slides up like a sheet; the desktop window
              // grows out of the launcher it belongs to.
              initial={reduce ? { opacity: 0 } : windowed ? { opacity: 0, scale: 0.96 } : { y: "100%" }}
              animate={reduce ? { opacity: 1 } : windowed ? { opacity: 1, scale: 1 } : { y: 0 }}
              exit={reduce ? { opacity: 0 } : windowed ? { opacity: 0, scale: 0.96 } : { y: "100%" }}
              transition={
                windowed
                  ? { duration: 0.2, ease: [0.23, 1, 0.32, 1] }
                  : { duration: 0.42, ease: [0.32, 0.72, 0, 1] }
              }
            >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-line pb-3 pl-2 pr-5 pt-[max(0.75rem,env(safe-area-inset-top))] sm:py-4 sm:pl-5">
                <div className="flex items-center gap-1 sm:gap-3">
                  {/* A full-screen page on a phone reads as somewhere you go
                      back from; the floating window on desktop closes. */}
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Back"
                    className="pressable grid size-11 place-items-center rounded-full text-ink-soft sm:hidden"
                  >
                    <CaretLeftIcon size={22} weight="bold" />
                  </button>
                  <span className="grid size-10 place-items-center rounded-full bg-ink text-paper">
                    <CupMark className="size-5" />
                  </span>
                  <div className="ml-2 sm:ml-0">
                    <p className="text-[16px] font-semibold leading-tight text-ink">Ask Craffé</p>
                    <p className="text-[13px] text-ink-soft">Your menu buddy</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="pressable -mr-2 hidden size-11 place-items-center rounded-full text-ink-soft hover:bg-paper-sunk sm:grid"
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
                          className="pressable min-h-11 rounded-full border border-line-strong bg-paper-raised px-4 text-[13.5px] font-medium text-ink"
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
                className="pressable ml-auto inline-flex h-9 items-center gap-1 rounded-full bg-ink px-3 text-[12.5px] font-semibold text-paper"
              >
                View bag
                <ArrowRightIcon size={13} weight="bold" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onView}
                className="pressable h-9 rounded-full border border-line-strong px-3 text-[12.5px] font-medium text-ink"
              >
                View product
              </button>
              <button
                onClick={onAdd}
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

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <motion.span
      className="inline-block size-2 rounded-full bg-ink-faint"
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}
