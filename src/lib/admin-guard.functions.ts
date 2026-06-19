import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Lockout policy: too many recent failures from this user blocks the area
// for a cooling-off period. Real audit log is in admin_access_attempts.
const RATE_LIMIT_WINDOW_MIN = 10;
const RATE_LIMIT_MAX_FAILURES = 5;

async function logAttempt(args: {
  userId: string | null;
  email: string | null;
  success: boolean;
  reason: string | null;
}) {
  try {
    const ip = getRequestIP({ xForwardedFor: true }) ?? null;
    const userAgent = getRequestHeader("user-agent") ?? null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("admin_access_attempts" as any).insert({
      user_id: args.userId,
      email: args.email,
      ip,
      user_agent: userAgent,
      success: args.success,
      reason: args.reason,
    });
  } catch (err) {
    // Audit logging must never break the actual check
    console.error("[admin-audit] failed to log attempt", err);
  }
}

/**
 * Server-side admin check + audit log + rate limit.
 * Every call (success OR failure) is recorded in admin_access_attempts.
 * If the same user has had >= RATE_LIMIT_MAX_FAILURES failures in the last
 * RATE_LIMIT_WINDOW_MIN minutes, the request is rejected with RATE_LIMITED
 * even before we check the role.
 */
export const ensureAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const email = (claims as any)?.email ?? null;

    // 1) Rate-limit recent failures (counted from the audit log, server-side)
    try {
      const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MIN * 60_000).toISOString();
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { count } = await supabaseAdmin
        .from("admin_access_attempts" as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("success", false)
        .gte("created_at", since);
      if ((count ?? 0) >= RATE_LIMIT_MAX_FAILURES) {
        await logAttempt({ userId, email, success: false, reason: "RATE_LIMITED" });
        throw new Error("RATE_LIMITED");
      }
    } catch (err) {
      if (err instanceof Error && err.message === "RATE_LIMITED") throw err;
      // If counting fails, keep going — never lock real admins out due to log failure
    }

    // 2) Actual role check
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (error) {
      await logAttempt({ userId, email, success: false, reason: `DB_ERROR:${error.message}` });
      throw new Error(error.message);
    }
    if (!data) {
      await logAttempt({ userId, email, success: false, reason: "NOT_ADMIN" });
      throw new Error("FORBIDDEN");
    }

    await logAttempt({ userId, email, success: true, reason: null });
    return { ok: true as const, userId };
  });
