import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Ticket,
  ChevronRight,
  Gift,
  Clock,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/coupons")({
  component: CouponsPage,
  head: () => ({
    meta: [
      { title: "Meus Cupons — Ember" },
      { name: "description", content: "Cupons de desconto e ofertas." },
    ],
  }),
});

const BRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function CouponsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", search: { redirect: "/coupons" } });
  }, [authLoading, user, navigate]);

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["available-coupons"],
    queryFn: async () => {
      const { data } = await supabase
        .from("coupons")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
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
          <h1 className="font-display text-2xl">Meus Cupons</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-8 rounded-3xl border border-ember/20 bg-ember/5 p-6">
          <div className="flex items-center gap-3 text-ember">
            <Sparkles className="h-5 w-5" />
            <h2 className="font-display text-lg">Ofertas para você</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Utilize os códigos abaixo na finalização do seu pedido para ganhar descontos exclusivos.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-40 animate-pulse rounded-3xl bg-charcoal/50 border border-border" />)}
          </div>
        ) : coupons?.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-charcoal/20 p-12 text-center">
            <Ticket className="mx-auto h-12 w-12 opacity-20" />
            <h2 className="mt-4 font-display text-xl opacity-50">Nenhum cupom disponível</h2>
            <p className="mt-2 text-sm text-muted-foreground">Fique de olho! Novas promoções aparecem aqui.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {coupons?.map(coupon => (
              <CouponCard key={coupon.id} coupon={coupon} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CouponCard({ coupon }: { coupon: any }) {
  const isFixed = coupon.discount_type === 'fixed';
  
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-charcoal/40 p-6 transition-all hover:bg-charcoal/60">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-ember/5 blur-2xl" />
      
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-ember/10 text-ember border border-ember/20">
            {isFixed ? <Gift className="h-7 w-7" /> : <Ticket className="h-7 w-7" />}
          </div>
          <div>
            <div className="font-display text-3xl text-gradient-ember">
              {isFixed ? BRL(coupon.value) : `${coupon.value}% OFF`}
            </div>
            <div className="text-sm font-bold text-foreground">{coupon.code}</div>
          </div>
        </div>
        <button 
          onClick={() => {
            navigator.clipboard.writeText(coupon.code);
            alert("Código copiado!");
          }}
          className="rounded-full bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition"
        >
          Copiar
        </button>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{coupon.description}</p>
      
      <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <Clock className="h-3 w-3" />
          {coupon.expires_at ? `Expira em ${new Date(coupon.expires_at).toLocaleDateString("pt-BR")}` : 'Sem expiração'}
        </div>
        {coupon.min_order_cents > 0 && (
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-ember">
            <AlertCircle className="h-3 w-3" />
            Mínimo {BRL(coupon.min_order_cents)}
          </div>
        )}
      </div>
    </div>
  );
}
