import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Filter,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldOff,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ensureAdmin } from "@/lib/admin-guard.functions";
import { listAdminAttempts, type ListAttemptsInput } from "@/lib/admin-audit.functions";

// Hidden admin audit screen — same obfuscation pattern as the admin entry.
// Double-gated: ensureAdmin server check + listAdminAttempts re-verifies role.
export const Route = createFileRoute("/sys-ctrl-x9k2-audit-7af3")({
  component: GuardedAuditPage,
  head: () => ({
    meta: [
      { title: "Auditoria" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function GuardedAuditPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const checkAdmin = useServerFn(ensureAdmin);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth", search: { redirect: "/sys-ctrl-x9k2-audit-7af3" } });
    }
  }, [authLoading, user, navigate]);

  const guard = useQuery({
    queryKey: ["server-admin-check", user?.id],
    queryFn: () => checkAdmin(),
    enabled: !!user,
    retry: false,
    staleTime: 30_000,
  });

  if (authLoading || (user && guard.isLoading)) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-ember" />
      </div>
    );
  }
  if (!user) return null;

  if (guard.isError || !guard.data?.ok) {
    const errMsg = guard.error instanceof Error ? guard.error.message : "";
    const rateLimited = /RATE_LIMITED/i.test(errMsg);
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6">
        <div className="max-w-sm rounded-3xl border border-border bg-charcoal/60 p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/15">
            <ShieldOff className="h-7 w-7 text-red-400" />
          </div>
          <h1 className="mt-5 font-display text-2xl">
            {rateLimited ? "Acesso bloqueado temporariamente" : "Acesso negado"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {rateLimited
              ? "Muitas tentativas recentes. Aguarde alguns minutos."
              : "Esta área é restrita a administradores. Esta tentativa foi registrada."}
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-2 text-sm font-bold uppercase tracking-wider text-primary-foreground"
          >
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  return <AuditPage />;
}

function AuditPage() {
  const listFn = useServerFn(listAdminAttempts);
  const [filters, setFilters] = useState<ListAttemptsInput>({
    successFilter: "all",
    limit: 100,
    offset: 0,
  });
  const [applied, setApplied] = useState<ListAttemptsInput>(filters);

  const { data, isFetching, refetch, error } = useQuery({
    queryKey: ["admin-attempts", applied],
    queryFn: () => listFn({ data: applied }),
    retry: false,
  });

  function apply() {
    setApplied({ ...filters, offset: 0 });
  }
  function reset() {
    const cleared: ListAttemptsInput = { successFilter: "all", limit: 100, offset: 0 };
    setFilters(cleared);
    setApplied(cleared);
  }

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const limit = applied.limit ?? 100;
  const offset = applied.offset ?? 0;
  const canPrev = offset > 0;
  const canNext = offset + rows.length < total;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-background/85 p-5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/sys-ctrl-x9k2-prime-7af3" className="rounded-full p-2 hover:bg-white/5">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-red-500/15">
              <ShieldAlert className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Segurança
              </div>
              <h1 className="font-display text-lg leading-none">Auditoria de acesso admin</h1>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white/10"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-5 py-8">
        {/* Filters */}
        <section className="rounded-3xl border border-white/5 bg-charcoal/40 p-5">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            <Filter className="h-3.5 w-3.5 text-ember" /> Filtros
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="De (data/hora)">
              <input
                type="datetime-local"
                value={filters.from ?? ""}
                onChange={(e) => setFilters({ ...filters, from: e.target.value || null })}
                className="input"
              />
            </Field>
            <Field label="Até (data/hora)">
              <input
                type="datetime-local"
                value={filters.to ?? ""}
                onChange={(e) => setFilters({ ...filters, to: e.target.value || null })}
                className="input"
              />
            </Field>
            <Field label="Email">
              <input
                type="text"
                placeholder="email contém…"
                value={filters.email ?? ""}
                onChange={(e) => setFilters({ ...filters, email: e.target.value || null })}
                className="input"
              />
            </Field>
            <Field label="User ID">
              <input
                type="text"
                placeholder="uuid exato"
                value={filters.userId ?? ""}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value || null })}
                className="input"
              />
            </Field>
            <Field label="IP">
              <input
                type="text"
                placeholder="ip contém…"
                value={filters.ip ?? ""}
                onChange={(e) => setFilters({ ...filters, ip: e.target.value || null })}
                className="input"
              />
            </Field>
            <Field label="Motivo">
              <input
                type="text"
                placeholder="ex.: NOT_ADMIN, RATE_LIMITED"
                value={filters.reason ?? ""}
                onChange={(e) => setFilters({ ...filters, reason: e.target.value || null })}
                className="input"
              />
            </Field>
            <Field label="Status">
              <select
                value={filters.successFilter ?? "all"}
                onChange={(e) =>
                  setFilters({ ...filters, successFilter: e.target.value as any })
                }
                className="input"
              >
                <option value="all">Todos</option>
                <option value="success">Apenas sucesso</option>
                <option value="failure">Apenas falhas</option>
              </select>
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={apply}
              className="rounded-full bg-ember px-5 py-2 text-xs font-black uppercase tracking-widest text-white shadow-ember hover:scale-[1.02]"
            >
              Aplicar filtros
            </button>
            <button
              onClick={reset}
              className="rounded-full bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/10"
            >
              Limpar
            </button>
            <span className="ml-auto text-xs text-muted-foreground">
              {total} registro{total === 1 ? "" : "s"}
            </span>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error instanceof Error ? error.message : "Erro ao carregar registros"}
          </div>
        )}

        {/* Table */}
        <section className="overflow-hidden rounded-3xl border border-white/5 bg-charcoal/40">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Quando</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">User ID</th>
                  <th className="px-4 py-3 text-left">IP</th>
                  <th className="px-4 py-3 text-left">Motivo</th>
                  <th className="px-4 py-3 text-left">User-Agent</th>
                </tr>
              </thead>
              <tbody>
                {isFetching && rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </td>
                  </tr>
                )}
                {!isFetching && rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      {r.success ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400">
                          <XCircle className="h-3 w-3" /> Falha
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">{r.email ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      {r.user_id ? r.user_id.slice(0, 8) + "…" : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">{r.ip ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">
                      {r.reason ? (
                        <code className="rounded bg-white/5 px-1.5 py-0.5 text-[10px]">
                          {r.reason}
                        </code>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[260px] truncate text-[11px] text-muted-foreground" title={r.user_agent ?? ""}>
                      {r.user_agent ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 px-4 py-3 text-xs">
            <div className="text-muted-foreground">
              Mostrando {rows.length === 0 ? 0 : offset + 1}–{offset + rows.length} de {total}
            </div>
            <div className="flex gap-2">
              <button
                disabled={!canPrev}
                onClick={() => setApplied({ ...applied, offset: Math.max(0, offset - limit) })}
                className="rounded-full bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-white/10"
              >
                Anterior
              </button>
              <button
                disabled={!canNext}
                onClick={() => setApplied({ ...applied, offset: offset + limit })}
                className="rounded-full bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-white/10"
              >
                Próximo
              </button>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        .input {
          width: 100%;
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 0.85rem;
          padding: 0.55rem 0.75rem;
          font-size: 0.8rem;
          color: inherit;
          outline: none;
          transition: border-color .15s;
        }
        .input:focus { border-color: hsl(var(--ember, 20 90% 55%)); }
        .input::placeholder { color: hsl(var(--muted-foreground)); opacity: .6; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5 block">
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
        {label}
      </span>
      {children}
    </label>
  );
}
