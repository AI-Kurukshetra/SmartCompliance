import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import type { AppRole, DashboardViewer } from "@/lib/auth-shared";

type ProfileRow = {
  email: string;
  full_name: string | null;
  role: AppRole;
  tenant_id: string;
};

type TenantRow = {
  name: string;
  slug: string;
};

export type TenantContext = {
  userId: string;
  tenantId: string;
  email: string;
  fullName: string | null;
  role: AppRole;
  tenantName: string | null;
  tenantSlug: string | null;
};

export async function getTenantContext() {
  if (!hasSupabaseEnv()) {
    return null as TenantContext | null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null as TenantContext | null;
  }

  const { data: rawProfile } = await supabase
    .from("users")
    .select("email, full_name, role, tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  const profile = rawProfile as ProfileRow | null;

  if (!profile) {
    return null as TenantContext | null;
  }

  const { data: rawTenant } = await supabase
    .from("tenants")
    .select("name, slug")
    .eq("id", profile.tenant_id)
    .maybeSingle();

  const tenant = rawTenant as TenantRow | null;

  return {
    userId: user.id,
    tenantId: profile.tenant_id,
    email: profile.email ?? user.email ?? "",
    fullName: profile.full_name,
    role: profile.role,
    tenantName: tenant?.name ?? null,
    tenantSlug: tenant?.slug ?? null,
  } satisfies TenantContext;
}

export async function getAuthState() {
  if (!hasSupabaseEnv()) {
    return {
      enabled: false,
      hasSession: false,
      viewer: null as DashboardViewer | null,
    };
  }

  const tenantContext = await getTenantContext();

  if (!tenantContext) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return {
      enabled: true,
      hasSession: Boolean(user),
      viewer: null as DashboardViewer | null,
    };
  }

  return {
    enabled: true,
    hasSession: true,
    viewer: {
      email: tenantContext.email,
      fullName: tenantContext.fullName,
      role: tenantContext.role,
      tenantName: tenantContext.tenantName,
      tenantSlug: tenantContext.tenantSlug,
    } satisfies DashboardViewer,
  };
}
