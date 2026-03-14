"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CustomerFormState } from "@/components/customers/form-state";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  createCustomer,
  updateCustomer,
} from "@/modules/customers/repository";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "@/modules/customers/validation";

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getCustomerValues(formData: FormData) {
  return {
    customerId: getField(formData, "customerId"),
    firstName: getField(formData, "firstName"),
    lastName: getField(formData, "lastName"),
    email: getField(formData, "email"),
    phone: getField(formData, "phone"),
    dateOfBirth: getField(formData, "dateOfBirth"),
    countryCode: getField(formData, "countryCode"),
    riskLevel: getField(formData, "riskLevel"),
  };
}

export async function createCustomerAction(
  _previousState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const values = getCustomerValues(formData);

  if (!hasSupabaseEnv()) {
    return {
      error: "Set the Supabase environment variables before creating customers.",
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
      error: "Your role does not allow customer creation.",
      values,
    };
  }

  const parsed = createCustomerSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid customer details.",
      values,
    };
  }

  const supabase = await createClient();

  try {
    await createCustomer(
      {
        supabase,
        tenantId: tenantContext.tenantId,
      },
      parsed.data,
    );
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to create the customer.",
      values,
    };
  }

  revalidatePath("/customers");
  revalidatePath("/dashboard");
  redirect("/customers");
}

export async function updateCustomerAction(
  _previousState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const values = getCustomerValues(formData);

  if (!hasSupabaseEnv()) {
    return {
      error: "Set the Supabase environment variables before updating customers.",
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
      error: "Your role does not allow customer updates.",
      values,
    };
  }

  const parsed = updateCustomerSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid customer details.",
      values,
    };
  }

  const supabase = await createClient();

  try {
    await updateCustomer(
      {
        supabase,
        tenantId: tenantContext.tenantId,
      },
      parsed.data.customerId,
      parsed.data,
    );
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to update the customer.",
      values,
    };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${parsed.data.customerId}/edit`);
  revalidatePath("/dashboard");
  redirect("/customers");
}
