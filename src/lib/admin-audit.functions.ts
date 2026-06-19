import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminAttempt = {
  id: string;
  user_id: string | null;
  email: string | null;
  ip: string | null;
  user_agent: string | null;
  success: boolean;
  reason: string | null;
  created_at: string;
};

export type ListAttemptsInput = {
  from?: string | null;
  to?: string | null;
  email?: string | null;
  userId?: string | null;
  ip?: string | null;
  reason?: string | null;
  successFilter?: "all" | "success" | "failure";
  limit?: number;
  offset?: number;
};

/**
 * Admin-only audit query against admin_access_attempts.
 * Server verifies the caller has the 'admin' role before returning any data.
 */
export const listAdminAttempts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ListAttemptsInput) => input ?? {})
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Role check — never trust the client to gate this
    const { data: roleRow, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr) throw new Error(roleErr.message);
    if (!roleRow) throw new Error("FORBIDDEN");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const limit = Math.min(Math.max(data.limit ?? 100, 1), 500);
    const offset = Math.max(data.offset ?? 0, 0);

    let q = supabaseAdmin
      .from("admin_access_attempts" as any)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    if (data.email) q = q.ilike("email", `%${data.email}%`);
    if (data.userId) q = q.eq("user_id", data.userId);
    if (data.ip) q = q.ilike("ip", `%${data.ip}%`);
    if (data.reason) q = q.ilike("reason", `%${data.reason}%`);
    if (data.successFilter === "success") q = q.eq("success", true);
    if (data.successFilter === "failure") q = q.eq("success", false);

    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return {
      rows: (rows ?? []) as unknown as AdminAttempt[],
      total: count ?? 0,
      limit,
      offset,
    };
  });
