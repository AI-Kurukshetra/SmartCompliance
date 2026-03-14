"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { RiskFormState } from "@/components/risk/form-state";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { runRiskDecisionEngine } from "@/modules/risk/repository";
import { runRiskDecisionSchema } from "@/modules/risk/validation";

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function runRiskDecisionAction(
  _previousState: RiskFormState,
  formData: FormData,
): Promise<RiskFormState> {
  const values = {
    verificationSessionId: getField(formData, "verificationSessionId"),
  };

  if (!hasSupabaseEnv()) {
    return {
      error: "Set the Supabase environment variables before running decisions.",
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
      error: "Your role does not allow decision engine execution.",
      values,
    };
  }

  const parsed = runRiskDecisionSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid risk decision payload.",
      values,
    };
  }

  const supabase = await createClient();

  try {
    await runRiskDecisionEngine(
      {
        supabase,
        tenantId: tenantContext.tenantId,
      },
      parsed.data,
    );
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to run risk decision engine.",
      values,
    };
  }

  revalidatePath("/verifications");
  redirect("/verifications");
}
