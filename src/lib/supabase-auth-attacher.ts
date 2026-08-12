import { createMiddleware } from "@tanstack/react-start";

/**
 * Equivalente ao `attachSupabaseAuth` gerado, porém importando o SDK do
 * Supabase de forma dinâmica dentro do handler. Isso evita que o
 * @supabase/supabase-js seja hoisted para o chunk crítico carregado por
 * todas as rotas (inclusive a landing pública).
 */
export const attachSupabaseAuthLazy = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
