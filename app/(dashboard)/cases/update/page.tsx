import { UpdateCaseForm } from "@/components/cases/update-case-form";
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
  listCases,
  listComplianceOfficers,
} from "@/modules/cases/repository";

export const metadata = {
  title: "Update Case | SmartCompliance",
};

export default async function UpdateCasePage() {
  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;
  const canManage = tenantContext ? canManageTenant(tenantContext.role) : false;

  let cases: Awaited<ReturnType<typeof listCases>> = [];
  let officers: Awaited<ReturnType<typeof listComplianceOfficers>> = [];

  if (isSupabaseEnabled && tenantContext) {
    const supabase = await createClient();
    [cases, officers] = await Promise.all([
      listCases(
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

  const officerOptions = officers.map((item) => ({
    id: item.id,
    label: `${item.fullName ?? item.email} (${item.email})`,
  }));
  const caseOptions = cases.map((item) => ({
    id: item.id,
    customerName: item.customerName,
    status: item.status,
    priority: item.priority,
  }));
  const notices = [];

  if (!isSupabaseEnabled) {
    notices.push({
      tone: "info" as const,
      message:
        "Supabase environment variables are missing, so case updates are disabled.",
    });
  }

  if (isSupabaseEnabled && tenantContext && !canManage) {
    notices.push({
      tone: "warning" as const,
      message: "Your role can review cases but cannot update case state.",
    });
  }

  if (isSupabaseEnabled && canManage && caseOptions.length === 0) {
    notices.push({
      tone: "info" as const,
      message: "No cases are available yet. Create a case before attempting an update.",
    });
  }

  return (
    <WorkflowShell
      backHref="/cases"
      backLabel="Back to cases"
      eyebrow="Case workflow"
      title="Update case status"
      description="Assign officers, set review status, request additional documents, and capture resolution decisions in one place."
      icon={ActivityIcon}
      formTitle="Case controls"
      formDescription="Use this form to keep the review queue current and make sure every case handoff is reflected in the operating state."
      facts={[
        {
          label: "Cases",
          value: `${caseOptions.length}`,
          detail: caseOptions.length > 0 ? "Available for update" : "Waiting on escalations",
        },
        {
          label: "Officers",
          value: `${officerOptions.length}`,
          detail: "Assignable reviewers",
        },
        {
          label: "Access",
          value: canManage ? "Update" : "Review",
          detail: canManage ? "Case controls enabled" : "Execution disabled",
        },
      ]}
      notices={notices}
      railEyebrow="Review controls"
      railTitle="Move work with intent"
      railDescription="Case updates should clarify ownership, resolution state, and the next evidence request without ambiguity."
      steps={[
        {
          title: "Pick the active case",
          detail: "Always update the exact case record that matches the review item you worked.",
          icon: ListChecksIcon,
        },
        {
          title: "Set ownership and outcome",
          detail: "Adjust assignee, status, and decision together so the queue reflects reality.",
          icon: UsersIcon,
        },
        {
          title: "Request more evidence",
          detail: "Trigger additional documentation only when the case truly needs customer follow-up.",
          icon: ActivityIcon,
        },
      ]}
      railLink={{ href: "/reports/new", label: "Generate follow-up reporting" }}
      visual={{
        src: "/compliance-grid-visual.svg",
        alt: "Case update workflow illustration",
      }}
    >
      <UpdateCaseForm
        disabled={!isSupabaseEnabled || !canManage}
        cases={caseOptions}
        officers={officerOptions}
      />
    </WorkflowShell>
  );
}
