import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ShieldOff, Loader2 } from "lucide-react";
import { AdminPage } from "./admin";
import { ensureAdmin } from "@/lib/admin-guard.functions";
import { useAuth } from "@/hooks/use-auth";

// Hidden admin entry. URL is intentionally obfuscated. Real gates:
//   1. Server-side ensureAdmin check (via createServerFn + RLS)
//   2. DB-level admin role enforced by RLS on user_roles
//   3. Component refuses to render protected UI without server confirmation
export const Route = createFileRoute("/sys-ctrl-x9k2-prime-7af3")({
  component: GuardedAdminPage,
  head: () => ({
    meta: [
      { title: "Sistema" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function GuardedAdminPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const checkAdmin = useServerFn(ensureAdmin);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth", search: { redirect: "/sys-ctrl-x9k2-prime-7af3" } });
    }
  }, [authLoading, user, navigate]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["server-admin-check", user?.id],
    queryFn: () => checkAdmin(),
    enabled: !!user,
    retry: false,
    staleTime: 30_000,
  });

  if (authLoading || (user && isLoading)) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-ember" />
      </div>
    );
  }

  if (!user) return null;

  if (isError || !data?.ok) {
    const isRateLimited = (data as any) == null && /RATE_LIMITED/i.test(String((arguments as any) ?? "")) // placeholder false
      ? true
      : false;
    const errMsg = (isError && (Reflect.get(Object(isError ? (data as any) ?? {} : {}), "message") as string)) || "";
    const rateLimited = /RATE_LIMITED/i.test(errMsg) || /RATE_LIMITED/i.test(String((data as any)?.error ?? ""));
    void isRateLimited;
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
              ? "Muitas tentativas recentes. Aguarde alguns minutos e tente novamente."
              : "Esta área requer privilégios de administrador validados pelo servidor. Esta tentativa foi registrada."}
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

  return <AdminPage />;
}
