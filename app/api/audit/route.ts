import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { listAuditLogs } from "@/modules/audit/repository";

export async function GET(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 503 },
    );
  }

  const tenantContext = await getTenantContext();

  if (!tenantContext) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const entityType = url.searchParams.get("entityType") ?? undefined;
  const action = url.searchParams.get("action") ?? undefined;
  const supabase = await createClient();

  try {
    const logs = await listAuditLogs(supabase, tenantContext.tenantId, {
      entityType,
      action,
    });

    return NextResponse.json({
      data: logs,
      meta: {
        count: logs.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load audit logs.",
      },
      { status: 500 },
    );
  }
}
