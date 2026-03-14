import { RunScreeningForm } from "@/components/watchlist/run-screening-form";
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
import { listVerificationSessions } from "@/modules/verifications/repository";

export const metadata = {
  title: "Run Screening | SmartCompliance",
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default async function RunScreeningPage() {
  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;
  const canManage = tenantContext ? canManageTenant(tenantContext.role) : false;

  const sessions =
    isSupabaseEnabled && tenantContext
      ? await listVerificationSessions(
          {
            supabase: await createClient(),
            tenantId: tenantContext.tenantId,
          },
          {},
        )
      : [];

  const sessionOptions = sessions.map((session) => ({
    id: session.id,
    label: `${session.customerName} • ${formatLabel(session.status)}`,
  }));
  const notices = [];

  if (!isSupabaseEnabled) {
    notices.push({
      tone: "info" as const,
      message:
        "Supabase environment variables are missing, so screening runs are disabled.",
    });
  }

  if (isSupabaseEnabled && tenantContext && !canManage) {
    notices.push({
      tone: "warning" as const,
      message: "Your role can review watchlist outcomes but cannot trigger screening runs.",
    });
  }

  if (isSupabaseEnabled && canManage && sessionOptions.length === 0) {
    notices.push({
      tone: "info" as const,
      message: "No verification sessions are available. Start a session before running screening.",
    });
  }

  return (
    <WorkflowShell
      backHref="/verifications"
      backLabel="Back to verifications"
      eyebrow="Watchlist providers"
      title="Run watchlist screening"
      description="Execute provider checks against an active verification session and persist the resulting screening outcomes."
      icon={ShieldCheckIcon}
      formTitle="Screening trigger"
      formDescription="Choose the session that should receive watchlist results, then launch the provider workflow for that customer."
      facts={[
        {
          label: "Sessions",
          value: `${sessionOptions.length}`,
          detail: sessionOptions.length > 0 ? "Available for provider checks" : "Create a session first",
        },
        {
          label: "Access",
          value: canManage ? "Run" : "Review",
          detail: canManage ? "Provider calls enabled" : "Execution disabled",
        },
        {
          label: "Output",
          value: "Matches",
          detail: "Persisted screening outcomes",
        },
      ]}
      notices={notices}
      railEyebrow="Provider runbook"
      railTitle="Screening discipline"
      railDescription="A screening run is only useful when it lands on the correct session and is reviewed with the right downstream context."
      steps={[
        {
          title: "Select the active case",
          detail: "Run screening on the customer session that owns the current onboarding decision.",
          icon: ShieldCheckIcon,
        },
        {
          title: "Trigger provider checks",
          detail: "Execute placeholder provider logic and capture any match signals.",
          icon: ActivityIcon,
        },
        {
          title: "Persist the outcome",
          detail: "Results remain available for risk scoring, manual review, and audit history.",
          icon: ListChecksIcon,
        },
      ]}
      railLink={{ href: "/verifications/decision", label: "Run decision next" }}
      visual={{
        src: "/landing-compliance-visual.svg",
        alt: "Watchlist screening workflow illustration",
      }}
    >
      <RunScreeningForm
        disabled={!isSupabaseEnabled || !canManage}
        sessions={sessionOptions}
      />
    </WorkflowShell>
  );
}
