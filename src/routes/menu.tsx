import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  AlertCircle,
  Loader2,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCart,
  cartSubtotalCents,
  lineTotalCents,
  lineUnitCents,
  type CartItem,
  type CartAddon,
  type CartLine,
} from "@/lib/cart-store";
import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { UserAvatar } from "@/components/UserAvatar";

const searchSchema = z.object({
  table: z.string().optional(),
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

const BRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function MenuPage() {
  const { table: qrToken } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("browsing");
  const [orderId, setOrderId] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrderId(window.localStorage.getItem("ember_active_order"));
    }
  }, []);
  
  const { data: tableData, isLoading: tableLoading } = useQuery({
    queryKey: ["table", qrToken],
    queryFn: async () => {
      if (!qrToken) return null;
      
      // Try by number first (legacy/easy)
      const { data: byNum } = await supabase.from("tables").select("*").eq("number", parseInt(qrToken)).single();
      if (byNum) return byNum;

      // Try by full qr_token
      const { data: byToken } = await supabase.from("tables").select("*").eq("qr_token", qrToken).single();
      return byToken;
    },
    enabled: !!qrToken,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("available", true).order("sort_order");
      return data ?? [];
    },
  });

  const { data: activeOrder, isLoading: orderLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data } = await supabase.from("orders").select("*").eq("id", orderId).single();
      return data;
    },
    enabled: !!orderId,
  });

  useEffect(() => {
    if (categories?.length && !activeCatId) {
      setActiveCatId(categories[0].id);
    }
  }, [categories, activeCatId]);

  useEffect(() => {
    if (activeOrder) {
      if (["completed", "cancelled"].includes(activeOrder.status)) {
        setOrderId(null);
        localStorage.removeItem("ember_active_order");
      } else {
        setStage("tracking");
      }
    }
  }, [activeOrder]);

  // Realtime subscription for the active order
  useEffect(() => {
    if (!orderId) return;
    const ch = supabase
      .channel(`order-${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, (p) => {
        qc.setQueryData(["order", orderId], p.new);
        toast.info(`Status do pedido: ${p.new.status}`);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orderId, qc]);

  const lines = useCart((s) => s.lines);
  const add = useCart((s) => s.add);
  const clear = useCart((s) => s.clear);
  const linesArr = useMemo(() => Object.values(lines), [lines]);
  const count = useMemo(() => linesArr.reduce((a, l) => a + l.qty, 0), [linesArr]);
  const subtotalCents = useMemo(() => cartSubtotalCents(linesArr), [linesArr]);

  const { data: addons } = useQuery({
    queryKey: ["product_addons"],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_addons")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      return data ?? [];
    },
  });

  const addonsByProduct = useMemo(() => {
    const map: Record<string, Tables<"product_addons">[]> = {};
    for (const a of addons ?? []) {
      (map[a.product_id] ??= []).push(a);
    }
    return map;
  }, [addons]);

  const filteredProducts = useMemo(
    () => products?.filter((p) => p.category_id === activeCatId) ?? [],
    [products, activeCatId],
  );

  if (qrToken && tableLoading) {
    return <CenterLoader label="Validando mesa..." />;
  }

  if (qrToken && !tableData && !tableLoading) {
    return <InvalidTable />;
  }

  if (stage === "tracking" && activeOrder) {
    return (
      <OrderTracking
        tableNumber={tableData?.number ?? 0}
        order={activeOrder}
        onNew={() => {
          setStage("browsing");
          setOrderId(null);
          localStorage.removeItem("ember_active_order");
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
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-ember shadow-ember">
              <Flame className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground leading-none">
                Mesa
              </div>
              <div className="font-display text-lg leading-tight">{tableData?.number ?? "??"}</div>
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-5 pb-3 scrollbar-hide">
          {categories?.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCatId(c.id)}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition ${
                activeCatId === c.id
                  ? "bg-ember text-primary-foreground shadow-ember"
                  : "bg-charcoal text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pt-6">
        <motion.div layout className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                addons={addonsByProduct[item.id] ?? []}
                onAdd={(chosen) => add(item, chosen)}
              />
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
            <span className="font-display text-xl">{BRL(subtotalCents)}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => setStage("checkout")}
        tableNumber={tableData?.number ?? 0}
      />

      <AnimatePresence>
        {stage === "checkout" && (
          <CheckoutSheet
            tableData={tableData}
            subtotalCents={subtotalCents}
            lines={linesArr}
            onClose={() => setStage("browsing")}
            onConfirm={(id) => {
              setOrderId(id);
              localStorage.setItem("ember_active_order", id);
              setStage("tracking");
              setCartOpen(false);
              clear();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductCard({ item, onAdd }: { item: CartItem; onAdd: () => void }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="group flex gap-4 overflow-hidden rounded-3xl border border-border bg-charcoal/60 p-3"
    >
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-charcoal">
        <img
          src={item.image_url ?? ""}
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
            {BRL(item.price_cents)}
          </div>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {item.description}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            {item.prep_minutes && (
              <span className="flex items-center gap-1">
                <Timer className="h-3 w-3" /> {item.prep_minutes}m
              </span>
            )}
            {item.kcal && <span>{item.kcal} kcal</span>}
          </div>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-ember transition hover:scale-105 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function CartDrawer({
  open,
  onClose,
  onCheckout,
  tableNumber,
}: {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
  tableNumber: number;
}) {
  const linesMap = useCart((s) => s.lines);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const lines = useMemo(() => Object.values(linesMap), [linesMap]);
  const subtotalCents = useMemo(
    () => lines.reduce((a, l) => a + l.qty * l.item.price_cents, 0),
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
                  Mesa {tableNumber}
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
                        src={l.item.image_url ?? ""}
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
                          {BRL(l.item.price_cents)} cada
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
                            {BRL(l.item.price_cents * l.qty)}
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
                  {BRL(subtotalCents)}
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
  tableData,
  subtotalCents,
  lines,
  onClose,
  onConfirm,
}: {
  tableData: any;
  subtotalCents: number;
  lines: any[];
  onClose: () => void;
  onConfirm: (id: string) => void;
}) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [method, setMethod] = useState<"card" | "applepay" | "pix">("pix");
  const [paying, setPaying] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const tax = subtotalCents * 0.1;
  
  const discountCents = useMemo(() => {
    if (!coupon) return 0;
    if (coupon.discount_type === 'fixed') return coupon.value;
    return Math.round(subtotalCents * (coupon.value / 100));
  }, [coupon, subtotalCents]);

  const total = Math.max(0, subtotalCents - discountCents + tax);

  async function validateCoupon() {
    if (!couponCode) return;
    setValidatingCoupon(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("active", true)
        .single();

      if (error || !data) {
        toast.error("Cupom inválido ou expirado");
        setCoupon(null);
        return;
      }

      if (data.min_order_cents && subtotalCents < data.min_order_cents) {
        toast.error(`Pedido mínimo para este cupom: ${BRL(data.min_order_cents)}`);
        setCoupon(null);
        return;
      }

      setCoupon(data);
      toast.success("Cupom aplicado!");
    } finally {
      setValidatingCoupon(false);
    }
  }

  async function pay() {
    setPaying(true);
    try {
      // 1. Create order
      const { data: order, error: orderErr } = await supabase.from("orders").insert({
        table_id: tableData?.id,
        customer_id: user?.id || null,
        subtotal_cents: subtotalCents,
        tax_cents: Math.round(tax),
        discount_cents: discountCents,
        total_cents: Math.round(total),
        payment_method: method,
        status: "received",
        coupon_id: coupon?.id || null,
      }).select().single();

      if (orderErr) throw orderErr;

      // 2. Create order items
      const items = lines.map(l => ({
        order_id: order.id,
        product_id: l.item.id,
        name_snapshot: l.item.name,
        qty: l.qty,
        unit_price_cents: l.item.price_cents,
      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(items);
      if (itemsErr) throw itemsErr;

      toast.success("Pedido realizado com sucesso!");
      onConfirm(order.id);
    } catch (e) {
      toast.error("Falha ao processar pedido");
      console.error(e);
    } finally {
      setPaying(false);
    }
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
          <div className="flex items-center gap-3">
            {user && (
              <UserAvatar
                url={profile?.avatar_url}
                name={profile?.display_name ?? user.email ?? undefined}
                className="h-11 w-11 rounded-2xl border border-border"
                iconClassName="h-5 w-5"
              />
            )}
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Mesa {tableData?.number ?? "??"} · Pagamento
              </div>
              <h3 className="font-display text-2xl">
                {profile?.display_name ? `${profile.display_name.split(" ")[0]}, pague e confirme` : "Pague e confirme"}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-charcoal">
            <X className="h-5 w-5" />
          </button>
        </div>


        <div className="space-y-5 px-6 py-5">
          <section>
            <h4 className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Resumo do pedido
            </h4>
            <div className="space-y-2 rounded-2xl border border-border bg-charcoal/50 p-4">
              {lines.map((l) => (
                <div key={l.item.id} className="flex justify-between text-sm">
                  <span>
                    <span className="font-bold text-ember">{l.qty}×</span> {l.item.name}
                  </span>
                  <span>{BRL(l.item.price_cents * l.qty)}</span>
                </div>
              ))}
              <div className="my-2 h-px bg-border" />
              
              {/* Coupon Section */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Ticket className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="CUPOM"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs font-bold uppercase tracking-widest focus:border-ember focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={validateCoupon}
                    disabled={validatingCoupon || !couponCode}
                    className="rounded-xl bg-charcoal px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white/5 disabled:opacity-50"
                  >
                    {validatingCoupon ? <Loader2 className="h-3 w-3 animate-spin" /> : "Aplicar"}
                  </button>
                </div>
                {coupon && (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                    <span>Cupom {coupon.code} aplicado</span>
                    <button onClick={() => setCoupon(null)} className="hover:text-white">Remover</button>
                  </div>
                )}
              </div>

              <Row label="Subtotal" value={BRL(subtotalCents)} />
              {discountCents > 0 && (
                <Row label="Desconto" value={`-${BRL(discountCents)}`} />
              )}
              <Row label="Taxa de serviço (10%)" value={BRL(tax)} />
              <Row label="Total" value={BRL(total)} bold />
            </div>
          </section>

          <section>
            <h4 className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Pagamento
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
                  {m === "applepay" ? "Apple Pay" : m === "pix" ? "PIX" : "Cartão"}
                </button>
              ))}
            </div>
          </section>

          <button
            disabled={paying}
            onClick={pay}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-ember py-5 text-lg font-bold uppercase tracking-[0.2em] text-white shadow-ember transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {paying ? <Loader2 className="h-5 w-5 animate-spin" /> : "Pagar Agora"}
          </button>
        </div>
      </motion.div>
    </>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-lg font-display text-ember" : "text-xs text-muted-foreground"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function OrderTracking({ tableNumber, order, onNew }: { tableNumber: number, order: any; onNew: () => void }) {
  const statusSteps = [
    { id: "received", label: "Recebido", icon: ClipboardListIcon },
    { id: "preparing", label: "Na Cozinha", icon: ChefHat },
    { id: "ready", label: "Pronto!", icon: Utensils },
    { id: "delivering", label: "A Caminho", icon: CheckCircle2 },
  ];

  const currentIdx = statusSteps.findIndex(s => s.id === order.status);

  return (
    <div className="min-h-screen bg-background px-6 py-12 text-center">
      <div className="mx-auto max-w-sm">
        <div className="relative mx-auto mb-8 grid h-24 w-24 place-items-center rounded-3xl bg-ember shadow-ember">
          <Flame className="h-12 w-12 text-white" />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -inset-2 -z-10 rounded-3xl bg-ember/20 blur-xl"
          />
        </div>

        <h2 className="font-display text-3xl">Pedido #{order.code}</h2>
        <p className="mt-2 text-muted-foreground">Mesa {tableNumber} · Acompanhe seu pedido</p>

        <div className="mt-12 space-y-8 text-left">
          {statusSteps.map((step, idx) => {
            const isDone = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const Icon = step.icon;
            
            return (
              <div key={step.id} className="relative flex items-center gap-5">
                {idx < statusSteps.length - 1 && (
                  <div className={`absolute left-6 top-10 h-8 w-0.5 ${isDone ? "bg-ember" : "bg-border"}`} />
                )}
                <div className={`grid h-12 w-12 place-items-center rounded-2xl border-2 transition-colors ${
                  isDone || isCurrent ? "border-ember bg-ember text-white" : "border-border bg-charcoal/50 text-muted-foreground"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className={`text-sm font-bold uppercase tracking-widest ${isDone || isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </div>
                  {isCurrent && <div className="text-xs text-ember">Aguarde um momento...</div>}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onNew}
          className="mt-16 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          Pedir mais coisas
        </button>
      </div>
    </div>
  );
}

function ClipboardListIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>
  );
}

function CenterLoader({ label }: { label: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-ember" />
        <p className="mt-4 font-display text-xl text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function InvalidTable() {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-5 text-center">
      <div className="max-w-sm rounded-3xl border border-border bg-charcoal/60 p-8">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="mt-6 font-display text-2xl">QR Code Inválido</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Não conseguimos identificar sua mesa. Por favor, peça ajuda ao garçom ou tente escanear novamente.
        </p>
        <Link
          to="/"
          className="mt-6 block w-full rounded-full bg-white/5 py-3 text-sm font-bold uppercase tracking-wider hover:bg-white/10"
        >
          Voltar para Home
        </Link>
      </div>
    </div>
  );
}
