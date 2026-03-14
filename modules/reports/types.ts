export const REPORT_TYPES = [
  "sar",
  "ctr",
  "audit_export",
  "operations_summary",
] as const;
export const REPORT_STATUSES = ["queued", "processing", "ready", "failed"] as const;
export const REPORT_EXPORT_FORMATS = ["csv", "pdf"] as const;

export type ReportType = (typeof REPORT_TYPES)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type ReportExportFormat = (typeof REPORT_EXPORT_FORMATS)[number];

export type ReportRecord = {
  id: string;
  reportType: ReportType;
  status: ReportStatus;
  generatedBy: string | null;
  reportData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type ReportFilters = {
  reportType?: ReportType;
  status?: ReportStatus;
};

export type GenerateReportInput = {
  reportType: ReportType;
  daysBack?: number;
};
