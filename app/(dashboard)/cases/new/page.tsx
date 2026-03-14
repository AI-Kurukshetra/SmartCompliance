import { CreateCaseForm } from "@/components/cases/create-case-form";
import { WorkflowShell } from "@/components/dashboard/workflow-shell";
import {
  ActivityIcon,
  ListChecksIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  listComplianceOfficers,
} from "@/modules/cases/repository";
import { listVerificationSessions } from "@/modules/verifications/repository";

export const metadata = {
  title: "Create Case | SmartCompliance",
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default async function NewCasePage() {
  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;
  const canManage = tenantContext ? canManageTenant(tenantContext.role) : false;

  let sessions: Awaited<ReturnType<typeof listVerificationSessions>> = [];
  let officers: Awaited<ReturnType<typeof listComplianceOfficers>> = [];

  if (isSupabaseEnabled && tenantContext) {
    const supabase = await createClient();
    [sessions, officers] = await Promise.all([
      listVerificationSessions(
        {
          supabase,
          tenantId: tenantContext.tenantId,
        },
        {},
      ),
      listComplianceOfficers({
        supabase,
        tenantId: tenantContext.tenantId,
      }),
    ]);
  }

  const sessionOptions = sessions.map((item) => ({
    id: item.id,
    label: `${item.customerName} • ${formatLabel(item.status)} • ${item.id.slice(0, 8)}`,
  }));
  const officerOptions = officers.map((item) => ({
    id: item.id,
    label: `${item.fullName ?? item.email} (${item.email})`,
  }));
  const notices = [];

  if (!isSupabaseEnabled) {
    notices.push({
      tone: "info" as const,
      message:
        "Supabase environment variables are missing, so case creation is disabled.",
    });
  }

  if (isSupabaseEnabled && tenantContext && !canManage) {
    notices.push({
      tone: "warning" as const,
      message: "Your role can review cases but cannot create new ones.",
    });
  }

  if (isSupabaseEnabled && canManage && sessionOptions.length === 0) {
    notices.push({
      tone: "info" as const,
      message: "No verification sessions are available right now. You can still create a standalone case.",
    });
  }

  return (
    <WorkflowShell
      backHref="/cases"
      backLabel="Back to cases"
      eyebrow="Case creation"
      title="Create a case"
      description="Open a manual review case from verification context or as a standalone escalation, then assign ownership."
      icon={ListChecksIcon}
      formTitle="Escalation brief"
      formDescription="Set the case priority, optionally link it to a verification session, and capture the first notes for the review team."
      facts={[
        {
          label: "Sessions",
          value: `${sessionOptions.length}`,
          detail: "Optional source context",
        },
        {
          label: "Officers",
          value: `${officerOptions.length}`,
          detail: "Assignment is optional",
        },
        {
          label: "Access",
          value: canManage ? "Create" : "Review",
          detail: canManage ? "Case creation enabled" : "Execution disabled",
        },
      ]}
      notices={notices}
      railEyebrow="Escalation guide"
      railTitle="Create useful cases"
      railDescription="A strong case record makes later resolution, audit, and reporting work dramatically easier."
      steps={[
        {
          title: "Link source context",
          detail: "Attach the verification session when the case is tied to onboarding or screening evidence.",
          icon: UsersIcon,
        },
        {
          title: "Set urgency clearly",
          detail: "Choose a priority level that reflects the operational risk and review SLA.",
          icon: ActivityIcon,
        },
        {
          title: "Capture reviewer intent",
          detail: "Use notes to leave a crisp handoff for the assigned officer or next reviewer.",
          icon: ListChecksIcon,
        },
      ]}
      railLink={{ href: "/cases/update", label: "Update open cases next" }}
      visual={{
        src: "/landing-compliance-visual.svg",
        alt: "Case creation workflow illustration",
      }}
    >
      <CreateCaseForm
        disabled={!isSupabaseEnabled || !canManage}
        verificationSessions={sessionOptions}
        officers={officerOptions}
      />
    </WorkflowShell>
  );
}
