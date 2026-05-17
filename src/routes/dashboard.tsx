import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Flame,
  LogOut,
  ShoppingBag,
  Clock,
  ChevronRight,
  FlameKindling,
  History,
  Settings,
  Star,
  User,
  Ticket,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, signOut } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Meu Dashboard — Ember" },
      { name: "description", content: "Gerencie seus pedidos e fidelidade." },
    ],
  }),
});

const BRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function DashboardPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", search: { redirect: "/dashboard" } });
  }, [authLoading, user, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["user-orders", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("customer_id", user!.id)
        .order("placed_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!user,
  });

  if (authLoading) return <div className="grid min-h-screen place-items-center bg-background">Carregando...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-charcoal/40 p-6 pt-12 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-charcoal border border-border overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-lg bg-ember shadow-ember">
                <Star className="h-3 w-3 text-white fill-white" />
              </div>
            </div>
            <div>
              <h1 className="font-display text-2xl">Olá, {profile?.display_name?.split(" ")[0] ?? "Cliente"}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
            className="rounded-full bg-white/5 p-3 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {/* Loyalty Section */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-ember/20 to-charcoal p-6 shadow-soft">
          <div className="absolute -right-6 -top-6 grid h-24 w-24 place-items-center rounded-full bg-ember/10 blur-2xl" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ember">
              <FlameKindling className="h-4 w-4" /> Clube Ember
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">Prata</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-5xl text-gradient-ember">1.420</span>
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">faíscas</span>
          </div>
          <div className="mt-6 space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-background">
              <div className="h-full w-3/4 rounded-full bg-ember shadow-ember" />
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span>800 p/ resgate</span>
              <span>580 p/ nível Ouro</span>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <ActionCard icon={Ticket} label="Cupons" color="text-ember" />
          <ActionCard icon={Settings} label="Perfil" color="text-muted-foreground" />
        </div>

        {/* Recent Orders */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">Pedidos Recentes</h2>
            <Link to="/dashboard" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">Ver todos</Link>
          </div>
          
          <div className="space-y-4">
            {ordersLoading ? (
              [1, 2].map(i => <div key={i} className="h-24 animate-pulse rounded-3xl bg-charcoal/50 border border-border" />)
            ) : recentOrders?.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-charcoal/20 p-10 text-center">
                <ShoppingBag className="mx-auto h-10 w-10 opacity-20" />
                <p className="mt-4 text-sm text-muted-foreground font-semibold">Você ainda não fez nenhum pedido.</p>
                <Link to="/menu" className="mt-4 inline-block font-display text-ember">Abrir Cardápio →</Link>
              </div>
            ) : (
              recentOrders?.map(order => (
                <OrderCard key={order.id} order={order} />
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function ActionCard({ icon: Icon, label, color }: { icon: any; label: string; color: string }) {
  return (
    <button className="flex items-center justify-between rounded-2xl border border-border bg-charcoal/40 p-4 transition hover:bg-charcoal/60">
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl bg-background border border-border ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="font-bold text-sm">{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

function OrderCard({ order }: { order: any }) {
  const statusLabels: Record<string, string> = {
    received: "Recebido",
    preparing: "Preparando",
    ready: "Pronto",
    delivering: "A caminho",
    completed: "Entregue",
    cancelled: "Cancelado",
  };

  return (
    <div className="group rounded-3xl border border-border bg-charcoal/40 p-5 transition hover:bg-charcoal/60">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-background border border-border">
            <History className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <div className="font-display text-lg">#{order.code}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(order.placed_at).toLocaleDateString("pt-BR")}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-lg text-ember">{BRL(order.total_cents)}</div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${
            order.status === "completed" ? "text-emerald-500" : "text-ember"
          }`}>
            {statusLabels[order.status as string]}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
        <div className="text-xs text-muted-foreground italic line-clamp-1 flex-1 mr-4">
          {order.order_items?.map((it: any) => `${it.qty}x ${it.name_snapshot}`).join(", ")}
        </div>
        <button className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/10">
          Refazer Pedido
        </button>
      </div>
    </div>
  );
}
