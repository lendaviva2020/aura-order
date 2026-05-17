import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ShoppingBag,
  Clock,
  ChevronRight,
  History,
  Calendar,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/orders")({
  component: OrdersHistoryPage,
  head: () => ({
    meta: [
      { title: "Meus Pedidos — Ember" },
      { name: "description", content: "Histórico completo de pedidos." },
    ],
  }),
});

const BRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  received: { label: "Recebido", color: "text-blue-400 bg-blue-400/10" },
  preparing: { label: "Preparando", color: "text-amber-400 bg-amber-400/10" },
  ready: { label: "Pronto", color: "text-emerald-400 bg-emerald-400/10" },
  delivering: { label: "A caminho", color: "text-purple-400 bg-purple-400/10" },
  completed: { label: "Entregue", color: "text-muted-foreground bg-white/5" },
  cancelled: { label: "Cancelado", color: "text-red-400 bg-red-400/10" },
};

function OrdersHistoryPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", search: { redirect: "/orders" } });
  }, [authLoading, user, navigate]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["all-user-orders", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*), tables(number)")
        .eq("customer_id", user!.id)
        .order("placed_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  if (authLoading) return <div className="grid min-h-screen place-items-center bg-background">Carregando...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 p-6 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <Link to="/dashboard" className="rounded-full p-2 hover:bg-white/5 transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-2xl">Meus Pedidos</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 animate-pulse rounded-3xl bg-charcoal/50 border border-border" />)}
          </div>
        ) : orders?.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-charcoal/20 p-12 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 opacity-20" />
            <h2 className="mt-4 font-display text-xl opacity-50">Nenhum pedido ainda</h2>
            <p className="mt-2 text-sm text-muted-foreground">Seus pedidos aparecerão aqui assim que você os fizer.</p>
            <Link to="/menu" className="mt-6 inline-block rounded-full bg-ember px-8 py-3 font-bold uppercase tracking-widest text-white shadow-ember">Ver Cardápio</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders?.map(order => (
              <DetailedOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function DetailedOrderCard({ order }: { order: any }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_MAP[order.status as string] || STATUS_MAP.received;

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-charcoal/40 transition-all hover:bg-charcoal/60">
      <div 
        className="flex cursor-pointer items-center justify-between p-5"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-background border border-border">
            <History className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg">#{order.code}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(order.placed_at).toLocaleDateString("pt-BR")} às {new Date(order.placed_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-display text-xl text-ember">{BRL(order.total_cents)}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
              {order.order_items?.length} {order.order_items?.length === 1 ? 'item' : 'itens'}
            </div>
          </div>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/50 bg-black/20"
          >
            <div className="p-5 space-y-4">
              <ul className="space-y-2">
                {order.order_items?.map((it: any) => (
                  <li key={it.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      <span className="font-bold text-foreground">{it.qty}x</span> {it.name_snapshot}
                    </span>
                    <span>{BRL(it.unit_price_cents * it.qty)}</span>
                  </li>
                ))}
              </ul>

              <div className="h-px bg-border/50" />

              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{BRL(order.subtotal_cents)}</span>
                </div>
                {order.discount_cents > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Desconto</span>
                    <span>-{BRL(order.discount_cents)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxa de serviço</span>
                  <span>{BRL(order.tax_cents)}</span>
                </div>
                <div className="flex justify-between pt-1 font-bold text-foreground text-sm">
                  <span>Total</span>
                  <span>{BRL(order.total_cents)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Mesa {order.tables?.number ?? "—"} · {order.payment_method?.toUpperCase()}
                </div>
                <button className="rounded-full bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition">
                  Repetir Pedido
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
