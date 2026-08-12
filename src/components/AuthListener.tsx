import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Assina as mudanças de auth e invalida router + queries.
 * Carregado via React.lazy no __root para manter o SDK do Supabase
 * fora do chunk crítico compartilhado por todas as rotas.
 */
export default function AuthListener(): null {
  const qc = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      qc.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, qc]);

  return null;
}
