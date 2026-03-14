import { NextResponse } from "next/server";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { generateReport, listReports } from "@/modules/reports/repository";
import {
  generateReportSchema,
  reportFiltersSchema,
} from "@/modules/reports/validation";

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
  const parsedFilters = reportFiltersSchema.safeParse({
    reportType: url.searchParams.get("reportType") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  });

  if (!parsedFilters.success) {
    return NextResponse.json(
      { error: parsedFilters.error.issues[0]?.message ?? "Invalid filters." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    const reports = await listReports(
      {
        supabase,
        tenantId: tenantContext.tenantId,
      },
      {
        reportType: parsedFilters.data.reportType,
        status: parsedFilters.data.status,
      },
    );

    return NextResponse.json({
      data: reports,
      meta: {
        count: reports.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load reports.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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

  if (!canManageTenant(tenantContext.role)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await request.json();
  const parsedBody = generateReportSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid report payload." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    const report = await generateReport(
      {
        supabase,
        tenantId: tenantContext.tenantId,
        actorUserId: tenantContext.userId,
      },
      parsedBody.data,
    );

    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to generate report.",
      },
      { status: 500 },
    );
  }
}
