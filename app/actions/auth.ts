"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  type AuthFormState,
  type AuthFormValues,
} from "@/components/auth/form-state";
import { normalizeTenantSlug } from "@/lib/auth-shared";
import { hasAdminSupabaseEnv, hasSupabaseEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid work email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const signupSchema = z.object({
  tenantName: z.string().trim().min(2, "Workspace name must be at least 2 characters."),
  tenantSlug: z.string().trim().min(2, "Workspace slug must be at least 2 characters."),
  fullName: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid work email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function buildErrorState(
  error: string,
  values: AuthFormValues = {},
): AuthFormState {
  return {
    error,
    values,
  };
}

function mapAuthError(message: string, fallback: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("already") || normalized.includes("registered")) {
    return "An account with this email already exists.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }

  return fallback;
}

export async function loginAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = {
    email: getField(formData, "email"),
  };

  if (!hasSupabaseEnv()) {
    return buildErrorState(
      "Set the Supabase environment variables before signing in.",
      values,
    );
  }

  const parsed = loginSchema.safeParse({
    email: values.email,
    password: getField(formData, "password"),
  });

  if (!parsed.success) {
    return buildErrorState(parsed.error.issues[0]?.message ?? "Invalid sign-in details.", values);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return buildErrorState(
      mapAuthError(error?.message ?? "", "Unable to sign in right now."),
      values,
    );
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();

    return buildErrorState(
      "This account is missing a tenant profile. Sign up first or ask an admin to provision it.",
      values,
    );
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signupAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const rawValues = {
    tenantName: getField(formData, "tenantName"),
    tenantSlug: getField(formData, "tenantSlug"),
    fullName: getField(formData, "fullName"),
    email: getField(formData, "email"),
  };

  if (!hasSupabaseEnv()) {
    return buildErrorState(
      "Set the Supabase environment variables before creating a workspace.",
      rawValues,
    );
  }

  if (!hasAdminSupabaseEnv()) {
    return buildErrorState(
      "Set `SUPABASE_SERVICE_ROLE_KEY` before creating workspaces.",
      rawValues,
    );
  }

  const parsed = signupSchema.safeParse({
    ...rawValues,
    password: getField(formData, "password"),
  });

  if (!parsed.success) {
    return buildErrorState(
      parsed.error.issues[0]?.message ?? "Invalid signup details.",
      rawValues,
    );
  }

  const tenantSlug = normalizeTenantSlug(parsed.data.tenantSlug);

  if (!tenantSlug) {
    return buildErrorState(
      "Workspace slug can only contain letters, numbers, and hyphens.",
      rawValues,
    );
  }

  const admin = createAdminClient();

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({
      name: parsed.data.tenantName,
      slug: tenantSlug,
    })
    .select("id")
    .single();

  if (tenantError || !tenant) {
    const slugConflict =
      tenantError && tenantError.code === "23505"
        ? "That workspace slug is already in use."
        : null;

    const unknownMessage = tenantError?.message ?? "Unable to create the workspace right now.";

    return buildErrorState(
      slugConflict ?? unknownMessage,
      {
        ...rawValues,
        tenantSlug,
      },
    );
  }

  const { error: authError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      tenant_id: tenant.id,
      full_name: parsed.data.fullName,
      role: "admin",
    },
  });

  if (authError) {
    await admin.from("tenants").delete().eq("id", tenant.id);

    return buildErrorState(
      `${mapAuthError(authError.message, "Unable to create the workspace owner.")}${
        authError.message ? ` (${authError.message})` : ""
      }`,
      {
        ...rawValues,
        tenantSlug,
      },
    );
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (signInError) {
    return buildErrorState(
      "Workspace created, but automatic sign-in failed. Use the login page to continue.",
      {
        ...rawValues,
        tenantSlug,
      },
    );
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logoutAction() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
