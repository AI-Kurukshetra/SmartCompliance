import { GenerateReportForm } from "@/components/reports/generate-report-form";
import { WorkflowShell } from "@/components/dashboard/workflow-shell";
import {
  ActivityIcon,
  FileChartIcon,
  ListChecksIcon,
} from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { REPORT_TYPES } from "@/modules/reports/types";

export const metadata = {
  title: "Generate Report | SmartCompliance",
};

export default async function GenerateReportPage() {
  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;
  const canManage = tenantContext ? canManageTenant(tenantContext.role) : false;
  const notices = [];

  if (!isSupabaseEnabled) {
    notices.push({
      tone: "info" as const,
      message:
        "Supabase environment variables are missing, so report generation is disabled.",
    });
  }

  if (isSupabaseEnabled && tenantContext && !canManage) {
    notices.push({
      tone: "warning" as const,
      message: "Your role can review reporting history but cannot generate new reports.",
    });
  }

  return (
    <WorkflowShell
      backHref="/reports"
      backLabel="Back to reports"
      eyebrow="Regulatory output"
      title="Generate a report"
      description="Build SAR, CTR, audit, or operations report payloads so they can move into export and regulator-facing workflows."
      icon={FileChartIcon}
      formTitle="Report request"
      formDescription="Pick the report type and lookback window that best match the regulatory or operational question you need to answer."
      facts={[
        {
          label: "Types",
          value: `${REPORT_TYPES.length}`,
          detail: "SAR, CTR, audit, and ops outputs",
        },
        {
          label: "Access",
          value: canManage ? "Generate" : "Review",
          detail: canManage ? "Report jobs enabled" : "Execution disabled",
        },
        {
          label: "Exports",
          value: "CSV / PDF",
          detail: "Available after job completion",
        },
      ]}
      notices={notices}
      railEyebrow="Reporting runbook"
      railTitle="Build reports that travel well"
      railDescription="Good reporting inputs make export files easier to explain to auditors, investigators, and internal teams."
      steps={[
        {
          title: "Choose the right report family",
          detail: "Match the report type to the operational or regulatory use case before generating it.",
          icon: FileChartIcon,
        },
        {
          title: "Set the review window",
          detail: "Use a lookback period that captures the relevant activity without unnecessary noise.",
          icon: ActivityIcon,
        },
        {
          title: "Export once ready",
          detail: "Completed jobs can move into CSV or PDF export from the reports queue.",
          icon: ListChecksIcon,
        },
      ]}
      railLink={{ href: "/reports", label: "Review generated reports" }}
      visual={{
        src: "/landing-compliance-visual.svg",
        alt: "Regulatory reporting workflow illustration",
      }}
    >
      <GenerateReportForm disabled={!isSupabaseEnabled || !canManage} />
    </WorkflowShell>
  );
}
