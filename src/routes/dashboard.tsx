import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
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
  Bell,
  Wallet,
  ArrowRight,
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

function DashboardPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

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
    <div className="min-h-screen bg-background pb-32">
      {/* Premium Header */}
      <header className="relative h-64 overflow-hidden pt-12">
        <div className="absolute inset-0 bg-ember-radial opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        
        <div className="relative mx-auto flex max-w-2xl items-center justify-between px-6">
          <div className="flex items-center gap-5">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative group cursor-pointer"
              onClick={() => navigate({ to: "/settings" })}
            >
              <div className="h-20 w-20 overflow-hidden rounded-[2rem] border-2 border-white/20 bg-charcoal/40 shadow-2xl backdrop-blur-md transition-all group-hover:border-ember/50">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name ?? ""} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-gradient-to-br from-charcoal to-background font-display text-2xl text-foreground/70">
                    {profile?.display_name?.split(" ").filter(Boolean).slice(0, 2).map((n: string) => n[0]?.toUpperCase()).join("") || <User className="h-10 w-10 text-muted-foreground" />}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-xl bg-ember shadow-ember">
                <Star className="h-3.5 w-3.5 text-white fill-white" />
              </div>
            </motion.div>
            <div>
              <motion.div
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
              >
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-3xl leading-none">Olá, {profile?.display_name?.split(" ")[0] ?? "Cliente"}</h1>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-400">Verificado</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground font-medium">{user.email}</p>
              </motion.div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-2xl bg-white/5 p-3 text-muted-foreground transition hover:bg-white/10 hover:text-foreground backdrop-blur-md"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-ember shadow-ember" />
            </button>
            <button
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
              className="rounded-2xl bg-white/5 p-3 text-muted-foreground transition hover:bg-white/10 hover:text-destructive backdrop-blur-md"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto -mt-16 max-w-2xl px-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <LoyaltyCards userId={user.id} />
        </div>


        {/* Action Menu */}
        <div className="mt-8 grid grid-cols-1 gap-3">
          <MenuAction 
            icon={History} 
            title="Meus Pedidos" 
            desc="Veja seu histórico e status em tempo real"
            onClick={() => navigate({ to: "/orders" })}
            badge={recentOrders?.length ? String(recentOrders.length) : undefined}
          />
          <MenuAction 
            icon={Ticket} 
            title="Meus Cupons" 
            desc="Confira suas ofertas e descontos ativos"
            onClick={() => navigate({ to: "/coupons" })}
            color="text-ember"
          />
          <MenuAction 
            icon={Settings} 
            title="Configurações" 
            desc="Edite seu perfil, foto e preferências"
            onClick={() => navigate({ to: "/settings" })}
          />
        </div>

        {/* Featured Order (Most Recent) */}
        {!ordersLoading && recentOrders && recentOrders[0] && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="font-display text-xl uppercase tracking-widest">Acompanhar Pedido</h2>
              <Link to="/orders" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">Ver todos</Link>
            </div>
            <OrderLiveCard order={recentOrders[0]} profile={profile} />
          </section>
        )}
      </main>

      {/* Persistent Bottom Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-background/80 p-5 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-2xl items-center justify-around">
          <NavIcon icon={Flame} label="Início" active />
          <Link to="/menu" className="group -mt-12 flex flex-col items-center">
            <div className="grid h-16 w-16 place-items-center rounded-[2rem] bg-ember text-white shadow-ember transition group-hover:scale-110">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-foreground">Cardápio</span>
          </Link>
          <button onClick={() => navigate({ to: "/settings" })} className="flex flex-col items-center gap-1 transition text-muted-foreground hover:text-foreground">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover ring-2 ring-border" />
            ) : (
              <User className="h-5 w-5" />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest">Perfil</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

const TIER_LABEL: Record<string, string> = {
  bronze: "Nível Bronze",
  prata: "Nível Prata",
  ouro: "Nível Ouro",
};

type LoyaltyAccount = Pick<
  Database["public"]["Tables"]["loyalty_accounts"]["Row"],
  "points_balance" | "tier"
>;
type LoyaltyReward = Pick<
  Database["public"]["Tables"]["loyalty_rewards"]["Row"],
  "id" | "name" | "cost_points"
>;

function LoyaltyCards({ userId }: { userId: string }) {
  const { data: account, isPending: accountLoading } = useQuery<LoyaltyAccount>({
    queryKey: ["loyalty-account", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_accounts")
        .select("points_balance, tier")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data ?? { points_balance: 0, tier: "bronze" };
    },
  });

  const { data: rewards, isPending: rewardsLoading } = useQuery<LoyaltyReward[]>({
    queryKey: ["loyalty-rewards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_rewards")
        .select("id, name, cost_points")
        .eq("active", true)
        .order("cost_points", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const loading = accountLoading || rewardsLoading;
  const points = account?.points_balance ?? 0;
  const nextReward = useMemo(
    () => rewards?.find((r) => r.cost_points > points) ?? null,
    [rewards, points],
  );
  const progress = nextReward
    ? Math.min(100, Math.round((points / nextReward.cost_points) * 100))
    : 100;

  if (loading) {
    return (
      <>
        <LoyaltySkeleton />
        <LoyaltySkeleton />
      </>
    );
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-charcoal/40 p-6 shadow-soft backdrop-blur-xl transition hover:border-ember/20">
        <div className="absolute -right-4 -top-4 grid h-20 w-20 place-items-center rounded-full bg-ember/5 blur-xl" />
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-ember">
          <Wallet className="h-3 w-3" /> Saldo
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-display text-4xl text-gradient-ember">
            {points.toLocaleString("pt-BR")}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">faíscas</span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted-foreground">
            {TIER_LABEL[account?.tier ?? "bronze"]}
          </span>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-charcoal/40 p-6 shadow-soft backdrop-blur-xl transition hover:border-ember/20">
        <div className="absolute -right-4 -top-4 grid h-20 w-20 place-items-center rounded-full bg-emerald-500/5 blur-xl" />
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
          <Ticket className="h-3 w-3" /> Resgate
        </div>
        <div className="mt-3">
          <div className="text-sm font-bold">
            {nextReward ? nextReward.name : rewards?.length ? "Tudo liberado!" : "Em breve"}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {nextReward
              ? `Faltam ${(nextReward.cost_points - points).toLocaleString("pt-BR")} faíscas`
              : rewards?.length
                ? "Você pode resgatar qualquer recompensa"
                : "Novas recompensas chegando"}
          </div>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-background/50">
          <div
            className="h-full rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>
    </>
  );
}

function LoyaltySkeleton() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-charcoal/40 p-6 shadow-soft backdrop-blur-xl">
      <div className="h-3 w-16 animate-pulse rounded-full bg-white/10" />
      <div className="mt-4 h-8 w-24 animate-pulse rounded-lg bg-white/10" />
      <div className="mt-5 h-2 w-full animate-pulse rounded-full bg-white/5" />
    </section>
  );
}


function MenuAction({ icon: Icon, title, desc, onClick, color, badge }: any) {
  return (
    <button 
      onClick={onClick}
      className="group flex items-center gap-4 rounded-[1.5rem] border border-white/5 bg-charcoal/30 p-4 transition hover:bg-charcoal/50 hover:border-white/10"
    >
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-background border border-border group-hover:border-ember/30 transition ${color || "text-muted-foreground"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">{title}</span>
          {badge && <span className="rounded-full bg-ember px-2 py-0.5 text-[8px] font-black text-white">{badge}</span>}
        </div>
        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 transition group-hover:opacity-100 group-hover:translate-x-0" />
    </button>
  );
}

function NavIcon({ icon: Icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition ${active ? "text-ember" : "text-muted-foreground hover:text-foreground"}`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function OrderLiveCard({ order, profile }: { order: any; profile?: any }) {
  const statusLabels: Record<string, { label: string, color: string, progress: number }> = {
    received: { label: "Recebido", color: "text-ember", progress: 25 },
    preparing: { label: "Na Cozinha", color: "text-amber-400", progress: 50 },
    ready: { label: "Pronto!", color: "text-emerald-400", progress: 75 },
    delivering: { label: "A caminho", color: "text-purple-400", progress: 100 },
    completed: { label: "Entregue", color: "text-muted-foreground", progress: 100 },
    cancelled: { label: "Cancelado", color: "text-red-400", progress: 0 },
  };

  const status = statusLabels[order.status as string] || statusLabels.received;
  const initials = profile?.display_name?.split(" ").filter(Boolean).slice(0, 2).map((n: string) => n[0]?.toUpperCase()).join("") || "";

  return (
    <div className="group rounded-[2rem] border border-white/5 bg-gradient-to-br from-charcoal/50 to-background p-6 transition hover:border-white/10 shadow-soft">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0">
            <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-[1.2rem] bg-background border border-white/5">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : initials ? (
                <span className="font-display text-base text-foreground/80">{initials}</span>
              ) : (
                <History className="h-7 w-7 text-muted-foreground group-hover:text-ember transition" />
              )}
            </div>
            <div className={`absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-background border border-white/10 ${status.color}`}>
              <span className={`h-2 w-2 rounded-full ${status.color.replace('text', 'bg')} animate-pulse`} />
            </div>
          </div>
          <div>
            <div className="font-display text-2xl tracking-tight">#{order.code}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Pedido em andamento
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xs font-black uppercase tracking-widest ${status.color}`}>{status.label}</div>
          <div className="mt-1 font-display text-xl">R$ {(order.total_cents / 100).toFixed(2)}</div>
        </div>
      </div>
      
      <div className="mt-6 space-y-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-background/50">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${status.progress}%` }}
            className={`h-full rounded-full transition-all duration-1000 ${status.color.replace('text', 'bg')} shadow-soft`} 
          />
        </div>
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
          <span>Pedido feito</span>
          <span>Entrega</span>
        </div>
      </div>
    </div>
  );
}
