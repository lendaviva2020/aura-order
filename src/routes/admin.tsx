import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Boxes,
  ChefHat,
  ClipboardList,
  Flame,
  LayoutDashboard,
  LogOut,
  Plus,
  QrCode,
  ShieldCheck,
  Sparkles,
  Trash2,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, signOut } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { claimFirstAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Painel Admin — Ember" },
      { name: "description", content: "Gestão da operação Ember." },
    ],
  }),
});

type TabId = "overview" | "products" | "categories" | "tables" | "orders";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Resumo", icon: LayoutDashboard },
  { id: "orders", label: "Pedidos", icon: ClipboardList },
  { id: "products", label: "Produtos", icon: Boxes },
  { id: "categories", label: "Categorias", icon: Sparkles },
  { id: "tables", label: "Mesas", icon: Utensils },
];

function AdminPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const [tab, setTab] = useState<TabId>("overview");

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", search: { redirect: "/admin" } });
  }, [authLoading, user, navigate]);

  if (authLoading || rolesLoading) {
    return <CenterShell>Carregando…</CenterShell>;
  }
  if (!user) return null;
  if (!isAdmin) return <NotAdmin />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-ember shadow-ember">
              <Flame className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Ember
              </div>
              <div className="font-display text-lg leading-none">Painel</div>
            </div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 pb-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-ember text-primary-foreground shadow-ember"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6">
        {tab === "overview" && <OverviewTab />}
        {tab === "orders" && <OrdersTab />}
        {tab === "products" && <ProductsTab />}
        {tab === "categories" && <CategoriesTab />}
        {tab === "tables" && <TablesTab />}
      </main>
    </div>
  );
}

function CenterShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
      {children}
    </div>
  );
}

function NotAdmin() {
  const claim = useServerFn(claimFirstAdmin);
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  async function handleClaim() {
    setLoading(true);
    try {
      const res = await claim();
      if (res.promoted) {
        toast.success("Você agora é admin!");
        qc.invalidateQueries();
        window.location.reload();
      } else {
        toast.error("Já existe um admin neste projeto.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao promover");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="grid min-h-screen place-items-center bg-background px-5">
      <div className="max-w-md rounded-3xl border border-border bg-charcoal/60 p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ember shadow-ember">
          <ShieldCheck className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="mt-5 font-display text-3xl">Acesso restrito</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sua conta não tem perfil de administrador. Se você é o primeiro usuário
          deste restaurante, reivindique o acesso de admin abaixo.
        </p>
        <button
          onClick={handleClaim}
          disabled={loading}
          className="mt-6 w-full rounded-full bg-primary py-3 font-bold uppercase tracking-wider text-primary-foreground shadow-ember disabled:opacity-50"
        >
          {loading ? "Validando…" : "Sou o primeiro admin"}
        </button>
        <Link to="/" className="mt-4 inline-block text-sm text-muted-foreground hover:text-foreground">
          Voltar ao site
        </Link>
      </div>
    </div>
  );
}

/* ============== OVERVIEW ============== */

const BRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function OverviewTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: orders } = await supabase
        .from("orders")
        .select("id,status,total_cents,placed_at")
        .gte("placed_at", todayStart.toISOString());
      const list = orders ?? [];
      const revenue = list
        .filter((o) => o.status !== "cancelled")
        .reduce((a, o) => a + (o.total_cents ?? 0), 0);
      const active = list.filter((o) =>
        ["received", "preparing", "ready", "delivering"].includes(o.status),
      ).length;
      return {
        ordersToday: list.length,
        revenueCents: revenue,
        active,
      };
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("overview-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        qc.invalidateQueries({ queryKey: ["admin", "overview"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Stat label="Pedidos hoje" value={isLoading ? "—" : String(data?.ordersToday ?? 0)} />
      <Stat
        label="Receita do dia"
        value={isLoading ? "—" : BRL(data?.revenueCents ?? 0)}
        accent
      />
      <Stat label="Em andamento" value={isLoading ? "—" : String(data?.active ?? 0)} />
      <div className="sm:col-span-3">
        <RecentOrders />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-border bg-charcoal/50 p-6"
    >
      <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      <div
        className={`mt-2 font-display text-4xl ${
          accent ? "text-gradient-ember" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </motion.div>
  );
}

function RecentOrders() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "overview", "recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id,code,status,total_cents,placed_at,table_id, tables(number)")
        .order("placed_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });
  return (
    <div className="rounded-3xl border border-border bg-charcoal/40">
      <div className="border-b border-border px-6 py-4 font-display text-lg">
        Pedidos recentes
      </div>
      <div className="divide-y divide-border">
        {isLoading && <div className="p-6 text-muted-foreground">Carregando…</div>}
        {!isLoading && (data?.length ?? 0) === 0 && (
          <div className="p-6 text-muted-foreground">Nenhum pedido ainda.</div>
        )}
        {(data ?? []).map((o) => (
          <div key={o.id} className="flex items-center justify-between px-6 py-3 text-sm">
            <div>
              <div className="font-semibold">{o.code}</div>
              <div className="text-xs text-muted-foreground">
                Mesa {(o.tables as { number?: number } | null)?.number ?? "—"} ·{" "}
                {new Date(o.placed_at).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
            <StatusPill status={o.status} />
            <div className="font-display text-ember">{BRL(o.total_cents)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  received: "Recebido",
  preparing: "Preparando",
  ready: "Pronto",
  delivering: "A caminho",
  completed: "Entregue",
  cancelled: "Cancelado",
};

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "completed"
      ? "bg-emerald-500/15 text-emerald-400"
      : status === "cancelled"
        ? "bg-red-500/15 text-red-400"
        : "bg-ember/15 text-ember";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${tone}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

/* ============== ORDERS ============== */

function OrdersTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select(
          "id,code,status,payment_method,total_cents,placed_at,notes, tables(number), order_items(id,name_snapshot,qty,unit_price_cents)",
        )
        .order("placed_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  async function setStatus(id: string, status: string) {
    const patch: Record<string, unknown> = { status };
    if (status === "completed") patch.completed_at = new Date().toISOString();
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  }

  if (isLoading) return <div className="text-muted-foreground">Carregando…</div>;

  return (
    <div className="space-y-3">
      {(data?.length ?? 0) === 0 && (
        <EmptyState icon={ClipboardList} title="Sem pedidos ainda" hint="Os pedidos vão aparecer aqui em tempo real." />
      )}
      {(data ?? []).map((o) => (
        <div key={o.id} className="rounded-3xl border border-border bg-charcoal/50 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-display text-2xl">{o.code}</div>
              <div className="text-xs text-muted-foreground">
                Mesa {(o.tables as { number?: number } | null)?.number ?? "—"} ·{" "}
                {new Date(o.placed_at).toLocaleString("pt-BR")} ·{" "}
                {o.payment_method ?? "—"}
              </div>
            </div>
            <div className="text-right">
              <StatusPill status={o.status} />
              <div className="mt-1 font-display text-xl text-ember">{BRL(o.total_cents)}</div>
            </div>
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {(o.order_items ?? []).map((it) => (
              <li key={it.id} className="flex justify-between text-muted-foreground">
                <span>
                  <span className="font-bold text-ember">{it.qty}×</span> {it.name_snapshot}
                </span>
                <span>{BRL(it.unit_price_cents * it.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {(["received", "preparing", "ready", "delivering", "completed", "cancelled"] as const).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setStatus(o.id, s)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                    o.status === s
                      ? "border-ember bg-ember/15 text-ember"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============== PRODUCTS ============== */

type Category = { id: string; name: string; slug: string; sort_order: number };
type Product = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  category_id: string | null;
  image_url: string | null;
  available: boolean;
  featured: boolean;
  kcal: number | null;
  prep_minutes: number | null;
  tag: string | null;
  sort_order: number;
};

function ProductsTab() {
  const qc = useQueryClient();
  const cats = useQuery<Category[]>({
    queryKey: ["admin", "cats"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });
  const prods = useQuery<Product[]>({
    queryKey: ["admin", "prods"],
    queryFn: async () =>
      (await supabase.from("products").select("*").order("sort_order")).data ?? [],
  });

  const [draft, setDraft] = useState<Partial<Product>>({
    name: "",
    price_cents: 0,
    available: true,
    featured: false,
    sort_order: 0,
  });

  async function create() {
    if (!draft.name || !draft.category_id) {
      toast.error("Nome e categoria são obrigatórios");
      return;
    }
    const { error } = await supabase.from("products").insert({
      name: draft.name,
      description: draft.description ?? null,
      price_cents: draft.price_cents ?? 0,
      category_id: draft.category_id,
      image_url: draft.image_url ?? null,
      available: draft.available ?? true,
      featured: draft.featured ?? false,
      tag: draft.tag ?? null,
      kcal: draft.kcal ?? null,
      prep_minutes: draft.prep_minutes ?? null,
      sort_order: draft.sort_order ?? 0,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Produto criado");
    setDraft({ name: "", price_cents: 0, available: true, featured: false, sort_order: 0 });
    qc.invalidateQueries({ queryKey: ["admin", "prods"] });
  }

  async function toggle(p: Product) {
    await supabase.from("products").update({ available: !p.available }).eq("id", p.id);
    qc.invalidateQueries({ queryKey: ["admin", "prods"] });
  }
  async function del(id: string) {
    if (!confirm("Excluir este produto?")) return;
    await supabase.from("products").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "prods"] });
  }

  const catMap = useMemo(
    () => Object.fromEntries((cats.data ?? []).map((c) => [c.id, c.name])),
    [cats.data],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-3xl border border-border bg-charcoal/50 p-5 lg:col-span-1">
        <div className="mb-4 flex items-center gap-2 font-display text-lg">
          <Plus className="h-5 w-5 text-ember" /> Novo produto
        </div>
        <div className="space-y-3">
          <Field
            label="Nome"
            value={draft.name ?? ""}
            onChange={(v) => setDraft({ ...draft, name: v })}
          />
          <Field
            label="Descrição"
            value={draft.description ?? ""}
            onChange={(v) => setDraft({ ...draft, description: v })}
          />
          <Field
            label="Preço (R$)"
            type="number"
            step="0.01"
            value={draft.price_cents ? (draft.price_cents / 100).toString() : ""}
            onChange={(v) =>
              setDraft({ ...draft, price_cents: Math.round(parseFloat(v || "0") * 100) })
            }
          />
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Categoria
            </label>
            <select
              value={draft.category_id ?? ""}
              onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione…</option>
              {(cats.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Field
            label="Imagem (URL)"
            value={draft.image_url ?? ""}
            onChange={(v) => setDraft({ ...draft, image_url: v })}
          />
          <button
            onClick={create}
            className="w-full rounded-full bg-primary py-3 font-bold uppercase tracking-wider text-primary-foreground shadow-ember"
          >
            Criar
          </button>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="rounded-3xl border border-border bg-charcoal/40">
          <div className="border-b border-border px-6 py-4 font-display text-lg">
            Catálogo ({prods.data?.length ?? 0})
          </div>
          <div className="divide-y divide-border">
            {(prods.data ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 px-6 py-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {catMap[p.category_id ?? ""] ?? "Sem categoria"} · {BRL(p.price_cents)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggle(p)}
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      p.available
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-charcoal text-muted-foreground"
                    }`}
                  >
                    {p.available ? "Ativo" : "Inativo"}
                  </button>
                  <button
                    onClick={() => del(p.id)}
                    className="rounded-full p-2 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============== CATEGORIES ============== */

function CategoriesTab() {
  const qc = useQueryClient();
  const cats = useQuery<Category[]>({
    queryKey: ["admin", "cats"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  async function create() {
    if (!name || !slug) return toast.error("Nome e slug obrigatórios");
    const { error } = await supabase.from("categories").insert({ name, slug, sort_order: (cats.data?.length ?? 0) + 1 });
    if (error) return toast.error(error.message);
    setName("");
    setSlug("");
    qc.invalidateQueries({ queryKey: ["admin", "cats"] });
  }
  async function del(id: string) {
    if (!confirm("Excluir categoria?")) return;
    await supabase.from("categories").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "cats"] });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-3xl border border-border bg-charcoal/50 p-5">
        <div className="mb-4 flex items-center gap-2 font-display text-lg">
          <Plus className="h-5 w-5 text-ember" /> Nova categoria
        </div>
        <div className="space-y-3">
          <Field label="Nome" value={name} onChange={setName} />
          <Field
            label="Slug"
            value={slug}
            onChange={(v) => setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
          />
          <button
            onClick={create}
            className="w-full rounded-full bg-primary py-3 font-bold uppercase tracking-wider text-primary-foreground shadow-ember"
          >
            Criar
          </button>
        </div>
      </div>
      <div className="rounded-3xl border border-border bg-charcoal/40">
        <div className="border-b border-border px-6 py-4 font-display text-lg">
          Categorias ({cats.data?.length ?? 0})
        </div>
        <div className="divide-y divide-border">
          {(cats.data ?? []).map((c) => (
            <div key={c.id} className="flex items-center justify-between px-6 py-3">
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-muted-foreground">/{c.slug}</div>
              </div>
              <button
                onClick={() => del(c.id)}
                className="rounded-full p-2 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============== TABLES ============== */

type Table = {
  id: string;
  number: number;
  capacity: number;
  status: "free" | "occupied" | "reserved" | "maintenance";
  qr_token: string;
};

function TablesTab() {
  const qc = useQueryClient();
  const tables = useQuery<Table[]>({
    queryKey: ["admin", "tables"],
    queryFn: async () => (await supabase.from("tables").select("*").order("number")).data ?? [],
  });
  const [num, setNum] = useState("");
  const [cap, setCap] = useState("4");

  async function create() {
    const n = parseInt(num, 10);
    if (!n) return toast.error("Número da mesa obrigatório");
    const { error } = await supabase
      .from("tables")
      .insert({ number: n, capacity: parseInt(cap, 10) || 4 });
    if (error) return toast.error(error.message);
    setNum("");
    qc.invalidateQueries({ queryKey: ["admin", "tables"] });
  }

  async function del(id: string) {
    if (!confirm("Excluir mesa?")) return;
    await supabase.from("tables").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "tables"] });
  }

  function qrUrl(t: Table) {
    return `${window.location.origin}/menu?table=${t.number}&t=${t.qr_token.slice(0, 8)}`;
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="rounded-3xl border border-border bg-charcoal/50 p-5">
        <div className="mb-4 flex items-center gap-2 font-display text-lg">
          <Plus className="h-5 w-5 text-ember" /> Nova mesa
        </div>
        <div className="space-y-3">
          <Field label="Número" type="number" value={num} onChange={setNum} />
          <Field label="Capacidade" type="number" value={cap} onChange={setCap} />
          <button
            onClick={create}
            className="w-full rounded-full bg-primary py-3 font-bold uppercase tracking-wider text-primary-foreground shadow-ember"
          >
            Criar
          </button>
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {(tables.data ?? []).map((t) => (
            <div
              key={t.id}
              className="relative rounded-3xl border border-border bg-charcoal/50 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Mesa
                </div>
                <button
                  onClick={() => del(t.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="font-display text-4xl">{t.number}</div>
              <div className="text-xs text-muted-foreground">{t.capacity} lugares</div>
              <a
                href={qrUrl(t)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-ember/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-ember"
              >
                <QrCode className="h-3.5 w-3.5" /> Abrir cardápio
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============== Shared ============== */

function Field({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="block">
      <div className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-ember focus:outline-none"
      />
    </label>
  );
}

function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
}) {
  return (
    <div className="grid place-items-center rounded-3xl border border-dashed border-border bg-charcoal/30 p-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ember/15 text-ember">
        <Icon className="h-6 w-6" />
      </div>
      <div className="mt-4 font-display text-xl">{title}</div>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

// Avoid tree-shaking unused icon imports warning
void ChefHat;
