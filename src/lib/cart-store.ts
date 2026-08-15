import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Tables } from "@/integrations/supabase/types";

export type CartItem = Tables<"products">;

export type CartAddon = {
  id: string;
  name: string;
  price_cents: number;
};

export type CartLine = {
  item: CartItem;
  qty: number;
  note?: string;
  addons: CartAddon[];
};

/** Preço unitário (item + extras) em centavos inteiros. */
export function lineUnitCents(line: CartLine): number {
  return (
    line.item.price_cents +
    (line.addons ?? []).reduce((a, ad) => a + ad.price_cents, 0)
  );
}

/** Total da linha em centavos inteiros. */
export function lineTotalCents(line: CartLine): number {
  return line.qty * lineUnitCents(line);
}

/** Subtotal de uma lista de linhas em centavos inteiros. */
export function cartSubtotalCents(lines: CartLine[]): number {
  return lines.reduce((a, l) => a + lineTotalCents(l), 0);
}

type CartState = {
  lines: Record<string, CartLine>;
  add: (item: CartItem, addons?: CartAddon[]) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  setNote: (id: string, note: string) => void;
  toggleAddon: (productId: string, addon: CartAddon) => void;
  clear: () => void;
  count: () => number;
  subtotalCents: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: {},
      add: (item, addons) =>
        set((s) => {
          const existing = s.lines[item.id];
          return {
            lines: {
              ...s.lines,
              [item.id]: {
                item,
                qty: (existing?.qty ?? 0) + 1,
                note: existing?.note,
                addons: addons ?? existing?.addons ?? [],
              },
            },
          };
        }),
      remove: (id) =>
        set((s) => {
          const next = { ...s.lines };
          delete next[id];
          return { lines: next };
        }),
      setQty: (id, qty) =>
        set((s) => {
          if (qty <= 0) {
            const next = { ...s.lines };
            delete next[id];
            return { lines: next };
          }
          if (!s.lines[id]) return s;
          return { lines: { ...s.lines, [id]: { ...s.lines[id], qty } } };
        }),
      setNote: (id, note) =>
        set((s) =>
          s.lines[id] ? { lines: { ...s.lines, [id]: { ...s.lines[id], note } } } : s,
        ),
      toggleAddon: (productId, addon) =>
        set((s) => {
          const line = s.lines[productId];
          if (!line) return s;
          const current = line.addons ?? [];
          const exists = current.some((a) => a.id === addon.id);
          const addons = exists
            ? current.filter((a) => a.id !== addon.id)
            : [...current, addon];
          return { lines: { ...s.lines, [productId]: { ...line, addons } } };
        }),
      clear: () => set({ lines: {} }),
      count: () => Object.values(get().lines).reduce((a, l) => a + l.qty, 0),
      subtotalCents: () => cartSubtotalCents(Object.values(get().lines)),
    }),
    {
      name: "ember-cart",
      version: 2,
      migrate: (state) => {
        const s = state as CartState | undefined;
        if (!s?.lines) return s as CartState;
        const lines: Record<string, CartLine> = {};
        for (const [k, l] of Object.entries(s.lines)) {
          lines[k] = { ...l, addons: l.addons ?? [] };
        }
        return { ...s, lines };
      },
    },
  ),
);
