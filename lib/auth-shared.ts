export type AppRole = "admin" | "compliance_officer" | "developer";

export type DashboardViewer = {
  email: string;
  fullName: string | null;
  role: AppRole;
  tenantName: string | null;
  tenantSlug: string | null;
};

export function normalizeTenantSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatRoleLabel(role: AppRole) {
  return role.replaceAll("_", " ");
}

export function canManageTenant(role: AppRole) {
  return role === "admin" || role === "compliance_officer";
}
