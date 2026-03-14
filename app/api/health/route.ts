import { NextResponse } from "next/server";
import { hasAdminSupabaseEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const startedAt = Date.now();
  let database = {
    status: "not_configured" as "ok" | "degraded" | "not_configured",
    latencyMs: null as number | null,
    detail: "SUPABASE_SERVICE_ROLE_KEY is not configured.",
  };

  if (hasAdminSupabaseEnv()) {
    const dbCheckStart = Date.now();

    try {
      const admin = createAdminClient();
      const { error } = await admin
        .from("tenants")
        .select("id", { count: "exact", head: true })
        .limit(1);

      if (error) {
        database = {
          status: "degraded",
          latencyMs: Date.now() - dbCheckStart,
          detail: error.message,
        };
      } else {
        database = {
          status: "ok",
          latencyMs: Date.now() - dbCheckStart,
          detail: "Database reachable.",
        };
      }
    } catch (error) {
      database = {
        status: "degraded",
        latencyMs: Date.now() - dbCheckStart,
        detail: error instanceof Error ? error.message : "Database health check failed.",
      };
    }
  }

  const status = database.status === "degraded" ? "degraded" : "ok";

  return NextResponse.json({
    service: "smartcompliance",
    status,
    timestamp: new Date().toISOString(),
    uptimeSec: Math.round(process.uptime()),
    latencyMs: Date.now() - startedAt,
    checks: {
      database,
    },
  });
}
