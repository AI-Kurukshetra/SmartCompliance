"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TransactionFormState } from "@/components/transactions/form-state";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { ingestTransaction, updateAlertStatus } from "@/modules/transactions/repository";
import {
  ingestTransactionSchema,
  updateAlertStatusSchema,
} from "@/modules/transactions/validation";

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function ingestTransactionAction(
  _previousState: TransactionFormState<Record<string, string>>,
  formData: FormData,
): Promise<TransactionFormState<Record<string, string>>> {
  const values = {
    customerId: getField(formData, "customerId"),
    amount: getField(formData, "amount"),
    currency: getField(formData, "currency"),
    transactionType: getField(formData, "transactionType"),
    counterpartyCountry: getField(formData, "counterpartyCountry"),
  };

  if (!hasSupabaseEnv()) {
    return {
      error: "Set the Supabase environment variables before ingesting transactions.",
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
      error: "Your role does not allow transaction ingestion.",
      values,
    };
  }

  const parsed = ingestTransactionSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid transaction payload.",
      values,
    };
  }

  const supabase = await createClient();

  try {
    await ingestTransaction(
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
        error instanceof Error ? error.message : "Unable to ingest transaction.",
      values,
    };
  }

  revalidatePath("/monitoring");
  revalidatePath("/dashboard");
  redirect("/monitoring");
}

export async function updateAlertStatusAction(
  _previousState: TransactionFormState<Record<string, string>>,
  formData: FormData,
): Promise<TransactionFormState<Record<string, string>>> {
  const values = {
    alertId: getField(formData, "alertId"),
    status: getField(formData, "status"),
  };

  if (!hasSupabaseEnv()) {
    return {
      error: "Set the Supabase environment variables before updating alerts.",
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
      error: "Your role does not allow alert updates.",
      values,
    };
  }

  if (!values.alertId) {
    return {
      error: "Select a valid alert.",
      values,
    };
  }

  const parsed = updateAlertStatusSchema.safeParse({
    status: values.status,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid alert status update.",
      values,
    };
  }

  const supabase = await createClient();

  try {
    await updateAlertStatus(
      {
        supabase,
        tenantId: tenantContext.tenantId,
        actorUserId: tenantContext.userId,
      },
      values.alertId,
      parsed.data.status,
    );
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to update alert status.",
      values,
    };
  }

  revalidatePath("/monitoring");
  revalidatePath("/dashboard");
  redirect("/monitoring");
}
