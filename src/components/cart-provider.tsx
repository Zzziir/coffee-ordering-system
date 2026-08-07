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
import type { BranchId } from "@/lib/types";
import { isBranchId } from "@/lib/branches";

const STORAGE_KEY = "craffe.cart.v1";
const BRANCH_KEY = "craffe.branch.v1";

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  /** Which Craffé this bag is for. null until the customer picks one. */
  branchId: BranchId | null;
  setBranch: (id: BranchId) => void;
  addLine: (line: Omit<CartLine, "id">) => void;
  updateQty: (id: string, qty: number) => void;
  removeLine: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [branchId, setBranchId] = useState<BranchId | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate once on mount to avoid SSR/client mismatch.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }

    // A QR code at the counter carries its branch: /menu?b=mycc. Reading
    // location directly rather than useSearchParams keeps the marketing pages
    // statically rendered, and a scan is always a fresh page load anyway.
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(BRANCH_KEY);
    } catch {
      /* ignore corrupt storage */
    }
    const scanned = new URLSearchParams(window.location.search).get("b");
    const chosen = isBranchId(scanned) ? scanned : isBranchId(stored) ? stored : null;
    if (chosen) setBranchId(chosen);

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

  useEffect(() => {
    if (!hydrated || !branchId) return;
    try {
      localStorage.setItem(BRANCH_KEY, branchId);
    } catch {
      /* storage full / private mode — the picker just asks again next visit */
    }
  }, [branchId, hydrated]);

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

  const setBranch = useCallback((id: BranchId) => setBranchId(id), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: cartCount(lines),
      subtotal: cartSubtotal(lines),
      hydrated,
      branchId,
      setBranch,
      addLine,
      updateQty,
      removeLine,
      clear,
    }),
    [lines, hydrated, branchId, setBranch, addLine, updateQty, removeLine, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
