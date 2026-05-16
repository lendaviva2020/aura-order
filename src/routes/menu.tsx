import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import {
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  Flame,
  Minus,
  Plus,
  ShoppingBag,
  Timer,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { categories, menu, type MenuItem } from "@/lib/menu-data";
import { useCart } from "@/lib/cart-store";

const searchSchema = z.object({
  table: z.string().default("12"),
});

export const Route = createFileRoute("/menu")({
  validateSearch: searchSchema,
  component: MenuPage,
  head: () => ({
    meta: [
      { title: "Pedido — Ember" },
      {
        name: "description",
        content: "Monte seu pedido e pague direto da mesa. Powered by Ember.",
      },
    ],
  }),
});

type Stage = "browsing" | "checkout" | "tracking";

function MenuPage() {
  const { table } = Route.useSearch();
  const [activeCat, setActiveCat] = useState<(typeof categories)[number]["id"]>("burgers");
  const [cartOpen, setCartOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("browsing");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<
    "received" | "preparing" | "ready" | "delivering" | "completed"
  >("received");

  const lines = useCart((s) => s.lines);
  const add = useCart((s) => s.add);
  const clear = useCart((s) => s.clear);
  const linesArr = useMemo(() => Object.values(lines), [lines]);
  const count = useMemo(() => linesArr.reduce((a, l) => a + l.qty, 0), [linesArr]);
  const subtotal = useMemo(
    () => linesArr.reduce((a, l) => a + l.qty * l.item.price, 0),
    [linesArr],
  );

  const itemsByCat = useMemo(
    () => menu.filter((m) => m.category === activeCat),
    [activeCat],
  );

  function handleAdd(item: MenuItem) {
    add(item);
    toast.success(`${item.name} adicionado`, { duration: 1400 });
  }

  function placeOrder() {
    const id = `EM-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    setOrderId(id);
    setStage("tracking");
    setOrderStatus("received");
    setCartOpen(false);
    // Simulated status pipeline
    setTimeout(() => setOrderStatus("preparing"), 1800);
    setTimeout(() => setOrderStatus("ready"), 5200);
    setTimeout(() => setOrderStatus("delivering"), 8000);
    setTimeout(() => setOrderStatus("completed"), 11000);
    clear();
  }

  if (stage === "tracking" && orderId) {
    return (
      <OrderTracking
        table={table}
        orderId={orderId}
        status={orderStatus}
        onNew={() => {
          setStage("browsing");
          setOrderId(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-ember">
              <Flame className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground leading-none">
                Mesa
              </div>
              <div className="font-display text-lg leading-tight">{table}</div>
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-5 pb-3">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition ${
                activeCat === c.id
                  ? "bg-ember text-primary-foreground shadow-ember"
                  : "bg-charcoal text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pt-6">
        <motion.div layout className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {itemsByCat.map((item) => (
              <motion.article
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="group flex gap-4 overflow-hidden rounded-3xl border border-border bg-charcoal/60 p-3"
              >
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-charcoal">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                  {item.tag && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-ember px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                      {item.tag}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-xl leading-tight">{item.name}</h3>
                    <div className="font-display text-xl text-ember">
                      R$ {item.price.toFixed(2)}
                    </div>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Timer className="h-3 w-3" /> {item.prepMin}m
                      </span>
                      <span>{item.kcal} kcal</span>
                    </div>
                    <button
                      onClick={() => handleAdd(item)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-ember transition hover:scale-105 active:scale-95"
                    >
                      <Plus className="h-3.5 w-3.5" /> Adicionar
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </main>

      <AnimatePresence>
        {count > 0 && !cartOpen && (
          <motion.button
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            onClick={() => setCartOpen(true)}
            className="fixed inset-x-5 bottom-5 z-40 mx-auto flex max-w-md items-center justify-between rounded-full bg-primary px-5 py-4 text-primary-foreground shadow-ember"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag className="h-6 w-6" />
                <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-background text-xs font-bold text-foreground">
                  {count}
                </span>
              </div>
              <span className="font-bold uppercase tracking-wider">Ver carrinho</span>
            </div>
            <span className="font-display text-xl">R$ {subtotal.toFixed(2)}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => setStage("checkout")}
        table={table}
      />

      <AnimatePresence>
        {stage === "checkout" && (
          <CheckoutSheet
            table={table}
            subtotal={subtotal}
            lines={Object.values(lines)}
            onClose={() => setStage("browsing")}
            onConfirm={placeOrder}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CartDrawer({
  open,
  onClose,
  onCheckout,
  table,
}: {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
  table: string;
}) {
  const linesMap = useCart((s) => s.lines);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const lines = useMemo(() => Object.values(linesMap), [linesMap]);
  const subtotal = useMemo(
    () => lines.reduce((a, l) => a + l.qty * l.item.price, 0),
    [lines],
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-hidden rounded-t-3xl border-t border-border bg-background shadow-soft"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Mesa {table}
                </div>
                <h3 className="font-display text-2xl">Seu pedido</h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 hover:bg-charcoal"
                aria-label="Fechar carrinho"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
              {lines.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">Carrinho vazio.</p>
              ) : (
                <ul className="space-y-3">
                  {lines.map((l) => (
                    <li
                      key={l.item.id}
                      className="flex items-center gap-4 rounded-2xl border border-border bg-charcoal/50 p-3"
                    >
                      <img
                        src={l.item.image}
                        alt=""
                        className="h-16 w-16 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold">{l.item.name}</div>
                          <button
                            onClick={() => remove(l.item.id)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Remover"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          R$ {l.item.price.toFixed(2)} cada
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1 rounded-full border border-border">
                            <button
                              onClick={() => setQty(l.item.id, l.qty - 1)}
                              className="grid h-8 w-8 place-items-center hover:text-ember"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-6 text-center font-bold">{l.qty}</span>
                            <button
                              onClick={() => setQty(l.item.id, l.qty + 1)}
                              className="grid h-8 w-8 place-items-center hover:text-ember"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="font-display text-lg text-ember">
                            R$ {(l.item.price * l.qty).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-border bg-charcoal/40 px-6 py-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm uppercase tracking-widest text-muted-foreground">
                  Subtotal
                </span>
                <span className="font-display text-3xl text-gradient-ember">
                  R$ {subtotal.toFixed(2)}
                </span>
              </div>
              <button
                disabled={lines.length === 0}
                onClick={onCheckout}
                className="w-full rounded-full bg-primary py-4 text-base font-bold uppercase tracking-wider text-primary-foreground shadow-ember transition hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Finalizar pedido
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CheckoutSheet({
  table,
  subtotal,
  lines,
  onClose,
  onConfirm,
}: {
  table: string;
  subtotal: number;
  lines: { item: MenuItem; qty: number }[];
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [method, setMethod] = useState<"card" | "applepay" | "pix">("pix");
  const [paying, setPaying] = useState(false);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  function pay() {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      onConfirm();
    }, 1400);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/80 backdrop-blur"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-3xl border-t border-border bg-background"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background/95 px-6 py-5 backdrop-blur">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Table {table} · Checkout
            </div>
            <h3 className="font-display text-2xl">Pay & confirm</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-charcoal">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <section>
            <h4 className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Order summary
            </h4>
            <div className="space-y-2 rounded-2xl border border-border bg-charcoal/50 p-4">
              {lines.map((l) => (
                <div key={l.item.id} className="flex justify-between text-sm">
                  <span>
                    <span className="font-bold text-ember">{l.qty}×</span> {l.item.name}
                  </span>
                  <span>${(l.item.price * l.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="my-2 h-px bg-border" />
              <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
              <Row label="Tax (8%)" value={`$${tax.toFixed(2)}`} />
              <Row label="Total" value={`$${total.toFixed(2)}`} bold />
            </div>
          </section>

          <section>
            <h4 className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Payment
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {(["card", "applepay", "pix"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`rounded-2xl border px-3 py-4 text-xs font-bold uppercase tracking-widest transition ${
                    method === m
                      ? "border-ember bg-ember/10 text-ember"
                      : "border-border bg-charcoal/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "applepay" ? "Apple Pay" : m === "pix" ? "PIX" : "Card"}
                </button>
              ))}
            </div>
          </section>

          <button
            disabled={paying}
            onClick={pay}
            className="mt-2 w-full rounded-full bg-primary py-4 text-base font-bold uppercase tracking-wider text-primary-foreground shadow-ember transition hover:scale-[1.01] disabled:opacity-60"
          >
            {paying ? "Processing…" : `Pay $${total.toFixed(2)}`}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Demo payment · no real charge
          </p>
        </div>
      </motion.div>
    </>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div
      className={`flex justify-between ${
        bold ? "text-base font-display text-foreground" : "text-sm text-muted-foreground"
      }`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const STAGES = [
  { id: "received", label: "Received", icon: CheckCircle2 },
  { id: "preparing", label: "Preparing", icon: ChefHat },
  { id: "ready", label: "Ready", icon: Flame },
  { id: "delivering", label: "Delivering", icon: Utensils },
  { id: "completed", label: "Done", icon: CheckCircle2 },
] as const;

function OrderTracking({
  table,
  orderId,
  status,
  onNew,
}: {
  table: string;
  orderId: string;
  status: (typeof STAGES)[number]["id"];
  onNew: () => void;
}) {
  const activeIdx = STAGES.findIndex((s) => s.id === status);
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Order
            </div>
            <div className="font-display text-lg">{orderId}</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-ember/15"
        >
          <div className="grid h-20 w-20 place-items-center rounded-full bg-ember shadow-ember">
            <Flame className="h-10 w-10 text-primary-foreground" />
          </div>
        </motion.div>

        <h1 className="mt-8 text-center font-display text-5xl">
          {status === "completed" ? "Enjoy!" : "Order placed"}
        </h1>
        <p className="mt-2 text-center text-muted-foreground">
          Table <span className="font-bold text-foreground">{table}</span> · we'll bring it
          straight to you.
        </p>

        <div className="mt-12 rounded-3xl border border-border bg-charcoal/40 p-6">
          <div className="space-y-5">
            {STAGES.map((s, i) => {
              const done = i < activeIdx;
              const active = i === activeIdx;
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex items-center gap-4">
                  <div
                    className={`grid h-11 w-11 place-items-center rounded-full border transition ${
                      active
                        ? "border-ember bg-ember text-primary-foreground shadow-ember animate-ember-pulse"
                        : done
                          ? "border-ember/60 bg-ember/15 text-ember"
                          : "border-border text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div
                      className={`font-display text-xl ${
                        active || done ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </div>
                  </div>
                  {active && (
                    <span className="text-xs uppercase tracking-widest text-ember">Now</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {status === "completed" && (
          <button
            onClick={onNew}
            className="mt-8 w-full rounded-full bg-primary py-4 text-base font-bold uppercase tracking-wider text-primary-foreground shadow-ember transition hover:scale-[1.01]"
          >
            Order again
          </button>
        )}
      </main>
    </div>
  );
}
