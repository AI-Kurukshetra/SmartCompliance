"use client";

import { updateRuleAction } from "@/app/actions/rules";
import { RuleForm } from "@/components/rules/rule-form";
import type { RuleRecord } from "@/modules/rules/types";

type UpdateRuleFormProps = {
  disabled?: boolean;
  rule: RuleRecord;
};

export function UpdateRuleForm({ disabled = false, rule }: UpdateRuleFormProps) {
  return (
    <RuleForm
      action={updateRuleAction}
      disabled={disabled}
      initialValues={{
        ruleId: rule.id,
        name: rule.name,
        description: rule.description ?? "",
        score: String(rule.score),
        decisionAction: rule.decisionAction ?? "",
        enabled: rule.enabled ? "true" : "false",
        watchlistStatusIn: rule.condition.watchlistStatusIn?.join(",") ?? "",
        missingDocuments: rule.condition.missingDocuments ? "true" : "false",
        minDocumentConfidence:
          rule.condition.minDocumentConfidence !== undefined
            ? String(rule.condition.minDocumentConfidence)
            : "",
        maxDocumentConfidence:
          rule.condition.maxDocumentConfidence !== undefined
            ? String(rule.condition.maxDocumentConfidence)
            : "",
      }}
      submitIdleLabel="Save rule"
      submitPendingLabel="Saving rule..."
    />
  );
}
