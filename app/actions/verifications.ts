"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { VerificationFormState } from "@/components/verifications/form-state";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  createVerificationSession,
  uploadDocumentPlaceholder,
} from "@/modules/verifications/repository";
import {
  createVerificationSessionSchema,
  uploadDocumentPlaceholderSchema,
} from "@/modules/verifications/validation";

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createVerificationSessionAction(
  _previousState: VerificationFormState,
  formData: FormData,
): Promise<VerificationFormState> {
  const values = {
    customerId: getField(formData, "customerId"),
  };

  if (!hasSupabaseEnv()) {
    return {
      error: "Set the Supabase environment variables before creating sessions.",
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
      error: "Your role does not allow verification session creation.",
      values,
    };
  }

  const parsed = createVerificationSessionSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid verification session payload.",
      values,
    };
  }

  const supabase = await createClient();

  try {
    await createVerificationSession(
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
          : "Unable to create verification session.",
      values,
    };
  }

  revalidatePath("/verifications");
  redirect("/verifications");
}

export async function uploadDocumentPlaceholderAction(
  _previousState: VerificationFormState,
  formData: FormData,
): Promise<VerificationFormState> {
  const values = {
    verificationSessionId: getField(formData, "verificationSessionId"),
    documentType: getField(formData, "documentType"),
    fileName: getField(formData, "fileName"),
    mimeType: getField(formData, "mimeType"),
  };

  if (!hasSupabaseEnv()) {
    return {
      error: "Set the Supabase environment variables before uploading documents.",
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
      error: "Your role does not allow document uploads.",
      values,
    };
  }

  const parsed = uploadDocumentPlaceholderSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? "Invalid document placeholder payload.",
      values,
    };
  }

  const supabase = await createClient();

  try {
    await uploadDocumentPlaceholder(
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
          : "Unable to upload placeholder document.",
      values,
    };
  }

  revalidatePath("/verifications");
  redirect("/verifications");
}
