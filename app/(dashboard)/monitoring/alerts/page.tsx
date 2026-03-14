import { UpdateAlertForm } from "@/components/transactions/update-alert-form";
import { WorkflowShell } from "@/components/dashboard/workflow-shell";
import {
  ActivityIcon,
  ListChecksIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { listAlerts } from "@/modules/transactions/repository";

export const metadata = {
  title: "Update Alert Status | SmartCompliance",
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default async function UpdateAlertStatusPage() {
  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;
  const canManage = tenantContext ? canManageTenant(tenantContext.role) : false;

  const alerts =
    isSupabaseEnabled && tenantContext
      ? await listAlerts(
          {
            supabase: await createClient(),
            tenantId: tenantContext.tenantId,
          },
          {},
        )
      : [];

  const alertOptions = alerts.map((alert) => ({
    id: alert.id,
    label: `${formatLabel(alert.alertType)} • ${alert.customerName} • ${formatLabel(alert.status)}`,
  }));
  const notices = [];

  if (!isSupabaseEnabled) {
    notices.push({
      tone: "info" as const,
      message:
        "Supabase environment variables are missing, so alert updates are disabled.",
    });
  }

  if (isSupabaseEnabled && tenantContext && !canManage) {
    notices.push({
      tone: "warning" as const,
      message: "Your role can review alerts but cannot change alert status.",
    });
  }

  if (isSupabaseEnabled && canManage && alertOptions.length === 0) {
    notices.push({
      tone: "info" as const,
      message: "No alerts are available right now. Ingest transactions or wait for monitoring rules to generate them.",
    });
  }

  return (
    <WorkflowShell
      backHref="/monitoring"
      backLabel="Back to monitoring"
      eyebrow="Alert workflow"
      title="Update alert status"
      description="Transition monitoring alerts into acknowledged or resolved states after analyst review."
      icon={ListChecksIcon}
      formTitle="Alert resolution"
      formDescription="Select an open alert and update its workflow state so the monitoring queue reflects current analyst action."
      facts={[
        {
          label: "Alerts",
          value: `${alertOptions.length}`,
          detail: alertOptions.length > 0 ? "Available for analyst action" : "Waiting on monitoring output",
        },
        {
          label: "Access",
          value: canManage ? "Resolve" : "Review",
          detail: canManage ? "Status changes enabled" : "Execution disabled",
        },
        {
          label: "Output",
          value: "State",
          detail: "Acknowledged or resolved status",
        },
      ]}
      notices={notices}
      railEyebrow="Resolution notes"
      railTitle="Close alerts cleanly"
      railDescription="An alert status update should leave an obvious audit trail and clear operational signal for the next analyst."
      steps={[
        {
          title: "Select the alert",
          detail: "Pick the exact alert record you reviewed in the monitoring queue.",
          icon: ListChecksIcon,
        },
        {
          title: "Confirm the outcome",
          detail: "Move the alert into the correct lifecycle state once the review is complete.",
          icon: ActivityIcon,
        },
        {
          title: "Escalate when needed",
          detail: "If the signal warrants deeper review, convert it into a formal case workflow.",
          icon: ShieldCheckIcon,
        },
      ]}
      railLink={{ href: "/cases/new", label: "Open a related case" }}
      visual={{
        src: "/compliance-grid-visual.svg",
        alt: "Alert resolution workflow illustration",
      }}
    >
      <UpdateAlertForm disabled={!isSupabaseEnabled || !canManage} alerts={alertOptions} />
    </WorkflowShell>
  );
}
