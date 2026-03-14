"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { RuleFormState } from "@/components/rules/form-state";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createRule, updateRule } from "@/modules/rules/repository";
import { createRuleSchema } from "@/modules/rules/validation";

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function collectRuleValues(formData: FormData) {
  return {
    ruleId: getField(formData, "ruleId"),
    name: getField(formData, "name"),
    description: getField(formData, "description"),
    score: getField(formData, "score"),
    decisionAction: getField(formData, "decisionAction"),
    enabled: getField(formData, "enabled"),
    watchlistStatusIn: getField(formData, "watchlistStatusIn"),
    missingDocuments: getField(formData, "missingDocuments"),
    minDocumentConfidence: getField(formData, "minDocumentConfidence"),
    maxDocumentConfidence: getField(formData, "maxDocumentConfidence"),
  };
}

export async function createRuleAction(
  _previousState: RuleFormState,
  formData: FormData,
): Promise<RuleFormState> {
  const values = collectRuleValues(formData);

  if (!hasSupabaseEnv()) {
    return {
      error: "Set the Supabase environment variables before creating rules.",
      values,
    };
  }

  const tenantContext = await getTenantContext();

  if (!tenantContext) {
    return {
      error: "Your session is no longer valid. Sign in again.",
      values,
    };
  }

  if (!canManageTenant(tenantContext.role)) {
    return {
      error: "Your role does not allow rule management.",
      values,
    };
  }

  const parsed = createRuleSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid rule payload.",
      values,
    };
  }

  const supabase = await createClient();

  try {
    await createRule(
      {
        supabase,
        tenantId: tenantContext.tenantId,
        actorUserId: tenantContext.userId,
      },
      parsed.data,
    );
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create rule.",
      values,
    };
  }

  revalidatePath("/rules");
  revalidatePath("/dashboard");
  redirect("/rules");
}

export async function updateRuleAction(
  _previousState: RuleFormState,
  formData: FormData,
): Promise<RuleFormState> {
  const values = collectRuleValues(formData);

  if (!hasSupabaseEnv()) {
    return {
      error: "Set the Supabase environment variables before updating rules.",
      values,
    };
  }

  const tenantContext = await getTenantContext();

  if (!tenantContext) {
    return {
      error: "Your session is no longer valid. Sign in again.",
      values,
    };
  }

  if (!canManageTenant(tenantContext.role)) {
    return {
      error: "Your role does not allow rule management.",
      values,
    };
  }

  if (!values.ruleId) {
    return {
      error: "Rule id is required.",
      values,
    };
  }

  const parsed = createRuleSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid rule payload.",
      values,
    };
  }

  const supabase = await createClient();

  try {
    await updateRule(
      {
        supabase,
        tenantId: tenantContext.tenantId,
        actorUserId: tenantContext.userId,
      },
      values.ruleId,
      parsed.data,
    );
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to update rule.",
      values,
    };
  }

  revalidatePath("/rules");
  revalidatePath(`/rules/${values.ruleId}/edit`);
  revalidatePath("/dashboard");
  redirect("/rules");
}
