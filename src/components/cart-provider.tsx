"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import type { CartLine } from "@/lib/cart";
import { cartCount, cartSubtotal } from "@/lib/cart";

const STORAGE_KEY = "craffe.cart.v1";

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  addLine: (line: Omit<CartLine, "id">) => void;
  updateQty: (id: string, qty: number) => void;
  removeLine: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate once on mount to avoid SSR/client mismatch.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage full / private mode — cart just won't persist */
    }
  }, [lines, hydrated]);

  const addLine = useCallback((line: Omit<CartLine, "id">) => {
    setLines((prev) => [
      ...prev,
      { ...line, id: crypto.randomUUID() },
    ]);
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) => (l.id === id ? { ...l, qty } : l)),
    );
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: cartCount(lines),
      subtotal: cartSubtotal(lines),
      hydrated,
      addLine,
      updateQty,
      removeLine,
      clear,
    }),
    [lines, hydrated, addLine, updateQty, removeLine, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
