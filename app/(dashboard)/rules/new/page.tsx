import { CreateRuleForm } from "@/components/rules/create-rule-form";
import { WorkflowShell } from "@/components/dashboard/workflow-shell";
import {
  ActivityIcon,
  ListChecksIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";

export const metadata = {
  title: "Create Rule | SmartCompliance",
};

export default async function NewRulePage() {
  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;
  const canManage = tenantContext ? canManageTenant(tenantContext.role) : false;
  const notices = [];

  if (!isSupabaseEnabled) {
    notices.push({
      tone: "info" as const,
      message:
        "Supabase environment variables are missing, so rule creation is disabled.",
    });
  }

  if (isSupabaseEnabled && tenantContext && !canManage) {
    notices.push({
      tone: "warning" as const,
      message: "Your role can review rules but cannot create new policy logic.",
    });
  }

  return (
    <WorkflowShell
      backHref="/rules"
      backLabel="Back to rules"
      eyebrow="Rule builder"
      title="Create risk rule"
      description="Configure score impact, decision behavior, and rule conditions for tenant-specific decisioning."
      icon={ActivityIcon}
      formTitle="Policy draft"
      formDescription="Define how this rule should score, what it should do, and under which verification conditions it should apply."
      facts={[
        {
          label: "Scope",
          value: "Tenant",
          detail: "Applies inside the signed-in workspace",
        },
        {
          label: "Mode",
          value: "Draft",
          detail: "Design the policy before enabling it",
        },
        {
          label: "Access",
          value: canManage ? "Create" : "Review",
          detail: canManage ? "Rule creation enabled" : "Execution disabled",
        },
      ]}
      notices={notices}
      railEyebrow="Policy design"
      railTitle="Write rules with intent"
      railDescription="Clear, focused rules are easier to tune than giant catch-all logic that creates noisy decisions."
      steps={[
        {
          title: "Define the score effect",
          detail: "Set the risk impact to reflect how strongly the condition should influence decisions.",
          icon: ActivityIcon,
        },
        {
          title: "Choose the decision action",
          detail: "Escalate only when the rule truly deserves a workflow consequence.",
          icon: ShieldCheckIcon,
        },
        {
          title: "Constrain the condition",
          detail: "Use explicit watchlist and document thresholds so rule behavior stays explainable.",
          icon: ListChecksIcon,
        },
      ]}
      railLink={{ href: "/rules", label: "Review the full rule set" }}
      visual={{
        src: "/compliance-grid-visual.svg",
        alt: "Rule builder workflow illustration",
      }}
    >
      <CreateRuleForm disabled={!isSupabaseEnabled || !canManage} />
    </WorkflowShell>
  );
}
