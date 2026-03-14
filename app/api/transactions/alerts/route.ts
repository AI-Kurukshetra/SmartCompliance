import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { listAlerts } from "@/modules/transactions/repository";
import { alertFiltersSchema } from "@/modules/transactions/validation";

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
  const parsedFilters = alertFiltersSchema.safeParse({
    status: url.searchParams.get("status") ?? undefined,
    severity: url.searchParams.get("severity") ?? undefined,
    customerId: url.searchParams.get("customerId") ?? undefined,
  });

  if (!parsedFilters.success) {
    return NextResponse.json(
      { error: parsedFilters.error.issues[0]?.message ?? "Invalid filter values." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    const alerts = await listAlerts(
      {
        supabase,
        tenantId: tenantContext.tenantId,
      },
      {
        status: parsedFilters.data.status,
        severity: parsedFilters.data.severity,
        customerId: parsedFilters.data.customerId,
      },
    );

    return NextResponse.json({
      data: alerts,
      meta: {
        count: alerts.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load alerts.",
      },
      { status: 500 },
    );
  }
}
