import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Loader2, Mail, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Entrar — Ember" },
      { name: "description", content: "Entre na sua conta Ember." },
    ],
  }),
});

type Mode = "login" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect away
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: redirect ?? "/dashboard" });
    });
  }, [navigate, redirect]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        navigate({ to: redirect ?? "/dashboard" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado";
      toast.error(
        msg.includes("Invalid login")
          ? "E-mail ou senha inválidos"
          : msg.includes("already registered")
            ? "Este e-mail já está cadastrado"
            : msg,
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Falha no login com Google");
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      navigate({ to: redirect ?? "/" });
    } catch {
      toast.error("Falha no login com Google");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-ember/10 via-background to-background" />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, hsl(var(--primary)/0.25), transparent 40%)",
        }}
      />

      <Link
        to="/"
        className="absolute left-5 top-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-charcoal/70 p-8 backdrop-blur-xl shadow-soft"
      >
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ember shadow-ember">
            <Flame className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="mt-4 font-display text-3xl">
            {mode === "login" ? "Entrar na Ember" : "Criar conta"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Acesse sua conta para gerenciar pedidos"
              : "Cadastre-se em segundos"}
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleGoogle}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-full border border-border bg-background py-3 font-semibold text-foreground transition hover:bg-charcoal disabled:opacity-50"
        >
          <GoogleIcon /> Continuar com Google
        </button>

        <div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          ou
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-3">
          {mode === "signup" && (
            <Field
              icon={<Mail className="h-4 w-4" />}
              type="text"
              placeholder="Nome"
              value={name}
              onChange={setName}
              required
            />
          )}
          <Field
            icon={<Mail className="h-4 w-4" />}
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={setEmail}
            required
            autoComplete="email"
          />
          <Field
            icon={<Lock className="h-4 w-4" />}
            type="password"
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={setPassword}
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-base font-bold uppercase tracking-wider text-primary-foreground shadow-ember transition hover:scale-[1.01] disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              Ainda não tem conta?{" "}
              <button
                onClick={() => setMode("signup")}
                className="font-semibold text-ember hover:underline"
              >
                Cadastre-se
              </button>
            </>
          ) : (
            <>
              Já tem conta?{" "}
              <button
                onClick={() => setMode("login")}
                className="font-semibold text-ember hover:underline"
              >
                Entrar
              </button>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}

function Field({
  icon,
  value,
  onChange,
  ...rest
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-border bg-background/60 px-4 py-3 transition focus-within:border-ember">
      <span className="text-muted-foreground">{icon}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="#FFC107"
        d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.6 8.4 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.9 36 44 30.5 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
