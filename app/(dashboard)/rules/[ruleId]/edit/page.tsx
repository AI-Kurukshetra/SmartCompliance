import { notFound } from "next/navigation";
import { UpdateRuleForm } from "@/components/rules/update-rule-form";
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
import { getRuleById } from "@/modules/rules/repository";

export const metadata = {
  title: "Edit Rule | SmartCompliance",
};

type EditRulePageProps = {
  params: Promise<{
    ruleId: string;
  }>;
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default async function EditRulePage({ params }: EditRulePageProps) {
  const { ruleId } = await params;
  const isSupabaseEnabled = hasSupabaseEnv();

  if (!isSupabaseEnabled) {
    notFound();
  }

  const tenantContext = await getTenantContext();

  if (!tenantContext) {
    notFound();
  }

  const canManage = canManageTenant(tenantContext.role);
  let rule: Awaited<ReturnType<typeof getRuleById>>;

  try {
    rule = await getRuleById(
      {
        supabase: await createClient(),
        tenantId: tenantContext.tenantId,
      },
      ruleId,
    );
  } catch {
    notFound();
  }

  const notices = [];

  if (!canManage) {
    notices.push({
      tone: "warning" as const,
      message: "Your role can review rules but cannot save policy changes.",
    });
  }

  return (
    <WorkflowShell
      backHref="/rules"
      backLabel="Back to rules"
      eyebrow="Rule builder"
      title="Edit risk rule"
      description={`Updating ${rule.name} (v${rule.version}). Adjust conditions carefully so downstream decisions remain stable and explainable.`}
      icon={ActivityIcon}
      formTitle="Policy maintenance"
      formDescription="Refine the rule logic, decision behavior, or scoring impact without losing the original operational intent."
      facts={[
        {
          label: "Version",
          value: `v${rule.version}`,
          detail: "Current rule revision",
        },
        {
          label: "Status",
          value: rule.enabled ? "Enabled" : "Disabled",
          detail: "Live policy state",
        },
        {
          label: "Action",
          value: rule.decisionAction ? formatLabel(rule.decisionAction) : "Score only",
          detail: "Primary workflow effect",
        },
      ]}
      notices={notices}
      railEyebrow="Version discipline"
      railTitle="Tune without creating drift"
      railDescription="Rule edits should improve precision while keeping the decision narrative obvious to reviewers and auditors."
      steps={[
        {
          title: "Review the condition block",
          detail: "Make sure the trigger logic still matches the operational scenario the rule was meant to catch.",
          icon: ListChecksIcon,
        },
        {
          title: "Protect decision quality",
          detail: "Score and decision changes should reflect a real policy rationale, not just noise reduction.",
          icon: ShieldCheckIcon,
        },
        {
          title: "Re-run affected sessions",
          detail: "Use the decision engine after editing to confirm the new policy behaves as expected.",
          icon: ActivityIcon,
        },
      ]}
      railLink={{ href: "/verifications/decision", label: "Run the decision engine again" }}
      visual={{
        src: "/compliance-grid-visual.svg",
        alt: "Rule editing workflow illustration",
      }}
    >
      <UpdateRuleForm rule={rule} disabled={!canManage} />
    </WorkflowShell>
  );
}
