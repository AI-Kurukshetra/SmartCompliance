"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { WatchlistFormState } from "@/components/watchlist/form-state";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { runWatchlistScreening } from "@/modules/watchlist/repository";
import { runWatchlistScreeningSchema } from "@/modules/watchlist/validation";

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function runWatchlistScreeningAction(
  _previousState: WatchlistFormState,
  formData: FormData,
): Promise<WatchlistFormState> {
  const values = {
    verificationSessionId: getField(formData, "verificationSessionId"),
    provider: getField(formData, "provider"),
  };

  if (!hasSupabaseEnv()) {
    return {
      error: "Set the Supabase environment variables before screening.",
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
      error: "Your role does not allow watchlist screening.",
      values,
    };
  }

  const parsed = runWatchlistScreeningSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid screening request.",
      values,
    };
  }

  const supabase = await createClient();

  try {
    await runWatchlistScreening(
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
          : "Unable to run watchlist screening.",
      values,
    };
  }

  revalidatePath("/verifications");
  redirect("/verifications");
}
