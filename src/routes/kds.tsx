import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  ChefHat,
  Clock,
  LayoutDashboard,
  LogOut,
  Timer,
  Utensils,
  AlertCircle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, signOut } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/kds")({
  component: KDSPage,
  head: () => ({
    meta: [
      { title: "KDS — Cozinha & Salão" },
      { name: "description", content: "Sistema de Display de Cozinha em tempo real." },
    ],
  }),
});

type ViewType = "kitchen" | "waiter";
type OrderStatus = Database["public"]["Enums"]["order_status"];

function KDSPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isKitchen, isWaiter, isAdmin, loading: rolesLoading } = useRoles();
  const [view, setView] = useState<ViewType>("kitchen");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", search: { redirect: "/kds" } });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (isWaiter && !isKitchen) setView("waiter");
  }, [isKitchen, isWaiter]);

  if (authLoading || rolesLoading) return <div className="grid min-h-screen place-items-center bg-background">Carregando...</div>;
  if (!user) return null;
  if (!isAdmin && !isKitchen && !isWaiter) return <AccessDenied />;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-charcoal/80 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-ember shadow-ember">
              <ChefHat className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="font-display text-xl">KDS</h1>
          </div>
          <nav className="flex rounded-full bg-background/50 p-1">
            {(["kitchen", "waiter"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                  view === v ? "bg-ember text-white shadow-ember" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v === "kitchen" ? "Cozinha" : "Salão"}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="rounded-full p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground"
          >
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
          <div className="h-8 w-px bg-border" />
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground leading-none">Usuário</div>
            <div className="text-sm font-semibold">{user.email?.split("@")[0]}</div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
            className="rounded-full bg-white/5 p-2 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-6">
        <OrdersGrid view={view} soundEnabled={soundEnabled} audioRef={audioRef} />
      </main>
    </div>
  );
}

function OrdersGrid({ 
  view, 
  soundEnabled, 
  audioRef 
}: { 
  view: ViewType; 
  soundEnabled: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}) {
  const qc = useQueryClient();
  const statuses: OrderStatus[] = view === "kitchen" 
    ? ["received", "preparing"] 
    : ["ready", "delivering"];

  const { data: orders, isLoading } = useQuery({
    queryKey: ["kds", "orders", view],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select(`
          *,
          tables(number),
          order_items(*)
        `)
        .in("status", statuses)
        .order("placed_at", { ascending: true });
      return data ?? [];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("kds-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["kds", "orders", view] });
          if (payload.eventType === "INSERT" && soundEnabled && audioRef.current) {
            audioRef.current.play().catch(() => {});
            toast.info("Novo pedido recebido!", { icon: <Bell className="h-4 w-4 text-ember" /> });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, view, soundEnabled, audioRef]);

  if (isLoading) return <div className="text-center text-muted-foreground">Sincronizando fila...</div>;

  return (
    <div className="grid h-full auto-rows-max grid-cols-1 gap-6 overflow-y-auto pb-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AnimatePresence mode="popLayout">
        {orders?.map((order) => (
          <OrderCard key={order.id} order={order} view={view} />
        ))}
      </AnimatePresence>
      {orders?.length === 0 && (
        <div className="col-span-full grid place-items-center py-20 text-muted-foreground">
          <div className="text-center">
            <Utensils className="mx-auto h-12 w-12 opacity-20" />
            <p className="mt-4 font-display text-xl opacity-50">Nenhum pedido pendente</p>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, view }: { order: any; view: ViewType }) {
  const [elapsed, setElapsed] = useState(0);

  const anchor =
    order.status === "preparing" && order.preparing_at ? order.preparing_at : order.placed_at;

  useEffect(() => {
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(anchor).getTime()) / 60000);
      setElapsed(diff);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [anchor]);

  const priorityColor = elapsed > 15 ? "border-red-500 bg-red-500/10" : elapsed > 8 ? "border-amber-500 bg-amber-500/10" : "border-border bg-charcoal/40";
  const statusLabel = {
    received: "Novo",
    preparing: "Em Preparo",
    ready: "Pronto",
    delivering: "Saindo",
  }[order.status as string];

  async function nextStatus() {
    let next: OrderStatus = "completed";
    if (order.status === "received") next = "preparing";
    else if (order.status === "preparing") next = "ready";
    else if (order.status === "ready") next = "delivering";
    else if (order.status === "delivering") next = "completed";

    const { error } = await supabase.from("orders").update({ status: next }).eq("id", order.id);

    if (error) toast.error("Falha ao atualizar status");
    else toast.success(`Pedido ${order.code} movido para ${next}`);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`flex flex-col rounded-3xl border-2 p-5 shadow-xl transition-colors duration-500 ${priorityColor}`}
    >
      <div className="flex items-start justify-between border-b border-border/50 pb-4">
        <div>
          <div className="font-display text-3xl leading-none">{order.code}</div>
          <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
            <Utensils className="h-3.5 w-3.5" />
            Mesa {order.tables?.number ?? "—"}
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Clock className="h-3 w-3" /> {elapsed}m
          </div>
          <span className={`mt-1 inline-block rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest ${
            order.status === "received" ? "bg-ember text-white" : "bg-white/10 text-white"
          }`}>
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="flex-1 py-4">
        <ul className="space-y-3">
          {order.order_items?.map((item: any) => (
            <li key={item.id} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ember/20 font-display text-lg font-bold text-ember">
                {item.qty}
              </span>
              <div className="flex-1 font-semibold leading-tight">
                {item.name_snapshot}
                {item.notes && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-red-400">
                    <AlertCircle className="h-3 w-3" /> {item.notes}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={nextStatus}
        className={`mt-4 w-full rounded-2xl py-4 text-sm font-black uppercase tracking-[0.2em] transition active:scale-95 ${
          order.status === "received" || order.status === "ready"
            ? "bg-ember text-white shadow-ember hover:opacity-90"
            : "bg-white/10 text-white hover:bg-white/20"
        }`}
      >
        {view === "kitchen" 
          ? (order.status === "received" ? "Começar Preparo" : "Marcar Pronto")
          : (order.status === "ready" ? "Saiu para Entrega" : "Finalizar")}
      </button>
    </motion.div>
  );
}

function AccessDenied() {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-5 text-center">
      <div className="max-w-sm rounded-3xl border border-border bg-charcoal/60 p-8">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-500/20 text-red-500">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-2xl">Acesso Negado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Você não tem permissão para acessar o KDS. Contate um administrador.
        </p>
        <button
          onClick={() => (window.location.href = "/")}
          className="mt-6 w-full rounded-full bg-white/5 py-3 text-sm font-bold uppercase tracking-wider hover:bg-white/10"
        >
          Voltar para Home
        </button>
      </div>
    </div>
  );
}
