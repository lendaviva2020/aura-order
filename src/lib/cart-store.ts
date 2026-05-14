import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MenuItem } from "./menu-data";

export type CartLine = {
  item: MenuItem;
  qty: number;
  note?: string;
};

type CartState = {
  lines: Record<string, CartLine>;
  add: (item: MenuItem) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  setNote: (id: string, note: string) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: {},
      add: (item) =>
        set((s) => {
          const existing = s.lines[item.id];
          return {
            lines: {
              ...s.lines,
              [item.id]: { item, qty: (existing?.qty ?? 0) + 1, note: existing?.note },
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
      clear: () => set({ lines: {} }),
      count: () => Object.values(get().lines).reduce((a, l) => a + l.qty, 0),
      subtotal: () =>
        Object.values(get().lines).reduce((a, l) => a + l.qty * l.item.price, 0),
    }),
    { name: "ember-cart" },
  ),
);
