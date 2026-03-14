import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { exportReport } from "@/modules/reports/repository";
import { exportReportSchema } from "@/modules/reports/validation";

type ReportExportParams = {
  params: Promise<{
    reportId: string;
  }>;
};

export async function GET(request: Request, context: ReportExportParams) {
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

  const { reportId } = await context.params;

  if (!reportId) {
    return NextResponse.json({ error: "reportId is required." }, { status: 400 });
  }

  const url = new URL(request.url);
  const parsedQuery = exportReportSchema.safeParse({
    format: url.searchParams.get("format") ?? undefined,
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: parsedQuery.error.issues[0]?.message ?? "Invalid export format." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    const exported = await exportReport(
      {
        supabase,
        tenantId: tenantContext.tenantId,
      },
      reportId,
      parsedQuery.data.format,
    );

    const extension = exported.format === "csv" ? "csv" : "pdf";
    const filename = `${exported.report.reportType}_${exported.report.id}.${extension}`;

    return new NextResponse(exported.body, {
      status: 200,
      headers: {
        "Content-Type": exported.contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to export report.",
      },
      { status: 500 },
    );
  }
}
