import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/modules/audit/repository";
import type {
  GenerateReportInput,
  ReportExportFormat,
  ReportFilters,
  ReportRecord,
  ReportType,
} from "@/modules/reports/types";

type ReportRepositoryParams = {
  supabase: SupabaseClient;
  tenantId: string;
  actorUserId?: string | null;
};

type ReportRow = {
  id: string;
  report_type: ReportType;
  status: "queued" | "processing" | "ready" | "failed";
  generated_by: string | null;
  report_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type AlertForSar = {
  id: string;
  customer_id: string | null;
  transaction_id: string | null;
  alert_type: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "acknowledged" | "resolved";
  description: string;
  created_at: string;
};

type TransactionForCtr = {
  id: string;
  customer_id: string;
  amount: number;
  currency: string;
  transaction_type: string;
  status: "pending" | "cleared" | "flagged" | "blocked";
  counterparty_country: string | null;
  created_at: string;
};

type AuditLogRow = {
  id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  created_at: string;
};

function mapReport(row: ReportRow): ReportRecord {
  return {
    id: row.id,
    reportType: row.report_type,
    status: row.status,
    generatedBy: row.generated_by,
    reportData: row.report_data ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

function escapeCsv(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

function toCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) {
    return "no_data\n";
  }

  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsv(row[header] as string | number | null)).join(","),
    ),
  ];

  return `${lines.join("\n")}\n`;
}

function escapePdfText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function toSimplePdf(lines: string[]) {
  const safeLines = lines.slice(0, 36).map((line) => escapePdfText(line.slice(0, 110)));
  const textOperators = safeLines
    .map((line, index) =>
      index === 0 ? `(${line}) Tj` : `0 -16 Td\n(${line}) Tj`,
    )
    .join("\n");
  const content = `BT
/F1 12 Tf
48 760 Td
${textOperators}
ET`;

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n",
    `4 0 obj\n<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += object;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref
0 ${objects.length + 1}
0000000000 65535 f 
`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n 
`;
  }
  pdf += `trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
startxref
${xrefOffset}
%%EOF`;

  return Buffer.from(pdf, "utf8");
}

function asRows(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as Array<Record<string, unknown>>;
  }

  return value.filter(
    (item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null,
  );
}

function reportToExportContent(report: ReportRecord, format: ReportExportFormat) {
  const reportData = report.reportData;
  const summary =
    typeof reportData.summary === "object" && reportData.summary !== null
      ? (reportData.summary as Record<string, unknown>)
      : {};
  const rows = asRows(reportData.items);

  if (format === "csv") {
    if (rows.length > 0) {
      return Buffer.from(toCsv(rows), "utf8");
    }

    return Buffer.from(toCsv([summary]), "utf8");
  }

  const lines = [
    "SmartCompliance Report Export",
    `Report ID: ${report.id}`,
    `Type: ${report.reportType}`,
    `Status: ${report.status}`,
    `Completed At: ${report.completedAt ?? "N/A"}`,
    "",
    "Summary",
    ...Object.entries(summary).map(([key, value]) => `${key}: ${String(value)}`),
    "",
    "Rows",
    ...rows.slice(0, 20).map((row, index) => `${index + 1}. ${JSON.stringify(row)}`),
  ];

  return toSimplePdf(lines);
}

async function buildReportPayload(
  supabase: SupabaseClient,
  tenantId: string,
  input: GenerateReportInput,
) {
  const daysBack = input.daysBack ?? 30;
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

  if (input.reportType === "sar") {
    const { data, error } = await supabase
      .from("alerts")
      .select(
        "id, customer_id, transaction_id, alert_type, severity, status, description, created_at",
      )
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .in("severity", ["high", "critical"])
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(250);

    if (error) {
      throw new Error("Unable to build SAR report payload.");
    }

    const rows = (data ?? []) as AlertForSar[];

    return {
      generated_at: new Date().toISOString(),
      days_back: daysBack,
      summary: {
        suspicious_alerts: rows.length,
        critical_alerts: rows.filter((item) => item.severity === "critical").length,
      },
      items: rows.map((row) => ({
        alert_id: row.id,
        customer_id: row.customer_id,
        transaction_id: row.transaction_id,
        alert_type: row.alert_type,
        severity: row.severity,
        status: row.status,
        description: row.description,
        detected_at: row.created_at,
      })),
    } satisfies Record<string, unknown>;
  }

  if (input.reportType === "ctr") {
    const { data, error } = await supabase
      .from("transactions")
      .select(
        "id, customer_id, amount, currency, transaction_type, status, counterparty_country, created_at",
      )
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .gte("created_at", since)
      .gte("amount", 10000)
      .order("created_at", { ascending: false })
      .limit(250);

    if (error) {
      throw new Error("Unable to build CTR report payload.");
    }

    const rows = (data ?? []) as TransactionForCtr[];

    return {
      generated_at: new Date().toISOString(),
      days_back: daysBack,
      summary: {
        transactions_over_threshold: rows.length,
        total_amount: Number(
          rows.reduce((sum, item) => sum + Number(item.amount), 0).toFixed(2),
        ),
      },
      items: rows.map((row) => ({
        transaction_id: row.id,
        customer_id: row.customer_id,
        amount: row.amount,
        currency: row.currency,
        transaction_type: row.transaction_type,
        status: row.status,
        counterparty_country: row.counterparty_country,
        created_at: row.created_at,
      })),
    } satisfies Record<string, unknown>;
  }

  if (input.reportType === "audit_export") {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id, entity_type, entity_id, action, created_at")
      .eq("tenant_id", tenantId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      throw new Error("Unable to build audit export payload.");
    }

    const rows = (data ?? []) as AuditLogRow[];

    return {
      generated_at: new Date().toISOString(),
      days_back: daysBack,
      summary: {
        audit_events: rows.length,
      },
      items: rows.map((row) => ({
        audit_log_id: row.id,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        action: row.action,
        created_at: row.created_at,
      })),
    } satisfies Record<string, unknown>;
  }

  const [verificationCount, alertCount, caseCount, reportCount] = await Promise.all([
    supabase
      .from("verification_sessions")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .gte("created_at", since),
    supabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .gte("created_at", since),
    supabase
      .from("cases")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .gte("created_at", since),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .gte("created_at", since),
  ]);

  if (verificationCount.error || alertCount.error || caseCount.error || reportCount.error) {
    throw new Error("Unable to build operations summary payload.");
  }

  return {
    generated_at: new Date().toISOString(),
    days_back: daysBack,
    summary: {
      verifications: verificationCount.count ?? 0,
      alerts: alertCount.count ?? 0,
      cases: caseCount.count ?? 0,
      reports: reportCount.count ?? 0,
    },
    items: [
      {
        metric: "verifications",
        value: verificationCount.count ?? 0,
      },
      {
        metric: "alerts",
        value: alertCount.count ?? 0,
      },
      {
        metric: "cases",
        value: caseCount.count ?? 0,
      },
      {
        metric: "reports_generated",
        value: reportCount.count ?? 0,
      },
    ],
  } satisfies Record<string, unknown>;
}

export async function listReports(
  { supabase, tenantId }: Omit<ReportRepositoryParams, "actorUserId">,
  filters: ReportFilters,
) {
  let query = supabase
    .from("reports")
    .select(
      "id, report_type, status, generated_by, report_data, created_at, updated_at, completed_at",
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters.reportType) {
    query = query.eq("report_type", filters.reportType);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load reports.");
  }

  return ((data ?? []) as ReportRow[]).map((row) => mapReport(row));
}

export async function generateReport(
  { supabase, tenantId, actorUserId }: ReportRepositoryParams,
  input: GenerateReportInput,
) {
  const { data: insertedReport, error: insertError } = await supabase
    .from("reports")
    .insert({
      tenant_id: tenantId,
      report_type: input.reportType,
      status: "processing",
      generated_by: actorUserId ?? null,
      report_data: {},
    })
    .select(
      "id, report_type, status, generated_by, report_data, created_at, updated_at, completed_at",
    )
    .single();

  if (insertError || !insertedReport) {
    throw new Error("Unable to create report job.");
  }

  const reportId = (insertedReport as ReportRow).id;

  try {
    const reportData = await buildReportPayload(supabase, tenantId, input);
    const completionTimestamp = new Date().toISOString();
    const { data: updatedReport, error: updateError } = await supabase
      .from("reports")
      .update({
        status: "ready",
        report_data: reportData,
        completed_at: completionTimestamp,
      })
      .eq("tenant_id", tenantId)
      .eq("id", reportId)
      .select(
        "id, report_type, status, generated_by, report_data, created_at, updated_at, completed_at",
      )
      .single();

    if (updateError || !updatedReport) {
      throw new Error("Unable to finalize report payload.");
    }

    await writeAuditLog(supabase, {
      tenantId,
      actorUserId,
      entityType: "report",
      entityId: reportId,
      action: "report.generated",
      metadata: {
        reportType: input.reportType,
        daysBack: input.daysBack ?? 30,
      },
    });

    return mapReport(updatedReport as ReportRow);
  } catch (error) {
    await supabase
      .from("reports")
      .update({ status: "failed" })
      .eq("tenant_id", tenantId)
      .eq("id", reportId);
    throw error;
  }
}

export async function getReportById(
  { supabase, tenantId }: Omit<ReportRepositoryParams, "actorUserId">,
  reportId: string,
) {
  const { data, error } = await supabase
    .from("reports")
    .select(
      "id, report_type, status, generated_by, report_data, created_at, updated_at, completed_at",
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .eq("id", reportId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Report was not found.");
  }

  return mapReport(data as ReportRow);
}

export async function exportReport(
  params: Omit<ReportRepositoryParams, "actorUserId">,
  reportId: string,
  format: ReportExportFormat,
) {
  const report = await getReportById(params, reportId);

  if (report.status !== "ready") {
    throw new Error("Report is not ready for export.");
  }

  const body = reportToExportContent(report, format);

  return {
    report,
    format,
    contentType: format === "csv" ? "text/csv; charset=utf-8" : "application/pdf",
    body,
  };
}
