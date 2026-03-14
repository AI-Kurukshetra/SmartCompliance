"use client";

import { createRuleAction } from "@/app/actions/rules";
import { RuleForm } from "@/components/rules/rule-form";

type CreateRuleFormProps = {
  disabled?: boolean;
};

export function CreateRuleForm({ disabled = false }: CreateRuleFormProps) {
  return (
    <RuleForm
      action={createRuleAction}
      disabled={disabled}
      submitIdleLabel="Create rule"
      submitPendingLabel="Creating rule..."
    />
  );
}
