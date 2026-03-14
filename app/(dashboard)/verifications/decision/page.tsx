import { RunDecisionForm } from "@/components/risk/run-decision-form";
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
  title: "Run Decision Engine | SmartCompliance",
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default async function RunDecisionPage() {
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
        "Supabase environment variables are missing, so decision engine runs are disabled.",
    });
  }

  if (isSupabaseEnabled && tenantContext && !canManage) {
    notices.push({
      tone: "warning" as const,
      message: "Your role can review decisions but cannot trigger the decision engine.",
    });
  }

  if (isSupabaseEnabled && canManage && sessionOptions.length === 0) {
    notices.push({
      tone: "info" as const,
      message: "No verification sessions are available. Start a session before running the decision engine.",
    });
  }

  return (
    <WorkflowShell
      backHref="/verifications"
      backLabel="Back to verifications"
      eyebrow="Risk engine"
      title="Run decision engine"
      description="Evaluate the session risk profile and route the outcome to approve, reject, or manual review."
      icon={ActivityIcon}
      formTitle="Decision input"
      formDescription="Choose the verification session that should receive the latest rule evaluation and automated decision output."
      facts={[
        {
          label: "Sessions",
          value: `${sessionOptions.length}`,
          detail: sessionOptions.length > 0 ? "Ready for scoring" : "Create a session first",
        },
        {
          label: "Access",
          value: canManage ? "Execute" : "Review",
          detail: canManage ? "Decision runs enabled" : "Execution disabled",
        },
        {
          label: "Output",
          value: "Decision",
          detail: "Approve, reject, or review",
        },
      ]}
      notices={notices}
      railEyebrow="Decision flow"
      railTitle="What the engine does"
      railDescription="Rule scoring, document confidence, and screening context converge here into an operational outcome."
      steps={[
        {
          title: "Read the session context",
          detail: "Use the latest verification data, documents, and screening state as the scoring input.",
          icon: ListChecksIcon,
        },
        {
          title: "Apply risk logic",
          detail: "Evaluate the current rule set against the customer’s evidence and posture.",
          icon: ActivityIcon,
        },
        {
          title: "Route the outcome",
          detail: "Persist an automated decision or push the session into manual review.",
          icon: ShieldCheckIcon,
        },
      ]}
      railLink={{ href: "/cases/new", label: "Escalate manual review into a case" }}
      visual={{
        src: "/landing-compliance-visual.svg",
        alt: "Decision engine workflow illustration",
      }}
    >
      <RunDecisionForm
        disabled={!isSupabaseEnabled || !canManage}
        sessions={sessionOptions}
      />
    </WorkflowShell>
  );
}
