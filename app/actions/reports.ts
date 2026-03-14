"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ReportFormState } from "@/components/reports/form-state";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { generateReport } from "@/modules/reports/repository";
import { generateReportSchema } from "@/modules/reports/validation";

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function generateReportAction(
  _previousState: ReportFormState,
  formData: FormData,
): Promise<ReportFormState> {
  const values = {
    reportType: getField(formData, "reportType"),
    daysBack: getField(formData, "daysBack"),
  };

  if (!hasSupabaseEnv()) {
    return {
      error: "Set the Supabase environment variables before generating reports.",
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
      error: "Your role does not allow report generation.",
      values,
    };
  }

  const parsed = generateReportSchema.safeParse({
    reportType: values.reportType,
    daysBack: values.daysBack || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid report payload.",
      values,
    };
  }

  const supabase = await createClient();

  try {
    await generateReport(
      {
        supabase,
        tenantId: tenantContext.tenantId,
        actorUserId: tenantContext.userId,
      },
      parsed.data,
    );
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to generate report.",
      values,
    };
  }

  revalidatePath("/reports");
  revalidatePath("/dashboard");
  redirect("/reports");
}
