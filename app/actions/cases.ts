"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CaseFormState } from "@/components/cases/form-state";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createCase, updateCase } from "@/modules/cases/repository";
import { createCaseSchema, updateCaseSchema } from "@/modules/cases/validation";

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createCaseAction(
  _previousState: CaseFormState<Record<string, string>>,
  formData: FormData,
): Promise<CaseFormState<Record<string, string>>> {
  const values = {
    verificationSessionId: getField(formData, "verificationSessionId"),
    assignedTo: getField(formData, "assignedTo"),
    priority: getField(formData, "priority"),
    notes: getField(formData, "notes"),
  };

  if (!hasSupabaseEnv()) {
    return {
      error: "Set the Supabase environment variables before creating cases.",
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
      error: "Your role does not allow case creation.",
      values,
    };
  }

  const parsed = createCaseSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid case payload.",
      values,
    };
  }

  const supabase = await createClient();

  try {
    await createCase(
      {
        supabase,
        tenantId: tenantContext.tenantId,
        actorUserId: tenantContext.userId,
      },
      parsed.data,
    );
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create case.",
      values,
    };
  }

  revalidatePath("/cases");
  revalidatePath("/dashboard");
  redirect("/cases");
}

export async function updateCaseAction(
  _previousState: CaseFormState<Record<string, string>>,
  formData: FormData,
): Promise<CaseFormState<Record<string, string>>> {
  const values = {
    caseId: getField(formData, "caseId"),
    status: getField(formData, "status"),
    resolutionDecision: getField(formData, "resolutionDecision"),
    assignedTo: getField(formData, "assignedTo"),
    notes: getField(formData, "notes"),
  };

  if (!hasSupabaseEnv()) {
    return {
      error: "Set the Supabase environment variables before updating cases.",
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
      error: "Your role does not allow case updates.",
      values,
    };
  }

  if (!values.caseId) {
    return {
      error: "Select a valid case.",
      values,
    };
  }

  const parsed = updateCaseSchema.safeParse({
    status: values.status,
    resolutionDecision: values.resolutionDecision,
    assignedTo: values.assignedTo,
    notes: values.notes,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid case update payload.",
      values,
    };
  }

  const supabase = await createClient();

  try {
    await updateCase(
      {
        supabase,
        tenantId: tenantContext.tenantId,
        actorUserId: tenantContext.userId,
      },
      values.caseId,
      parsed.data,
    );
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to update case.",
      values,
    };
  }

  revalidatePath("/cases");
  revalidatePath("/dashboard");
  redirect("/cases");
}
