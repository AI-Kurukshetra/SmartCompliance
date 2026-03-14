import { CreateCustomerForm } from "@/components/customers/create-customer-form";
import { WorkflowShell } from "@/components/dashboard/workflow-shell";
import {
  GlobeIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";

export const metadata = {
  title: "Add Customer | SmartCompliance",
};

export default async function NewCustomerPage() {
  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;
  const canCreateCustomers = tenantContext
    ? canManageTenant(tenantContext.role)
    : false;
  const notices = [];

  if (!isSupabaseEnabled) {
    notices.push({
      tone: "info" as const,
      message:
        "Supabase environment variables are missing, so customer creation is disabled.",
    });
  }

  if (isSupabaseEnabled && tenantContext && !canCreateCustomers) {
    notices.push({
      tone: "warning" as const,
      message: "Your role can review customer data but cannot create new records.",
    });
  }

  return (
    <WorkflowShell
      backHref="/customers"
      backLabel="Back to customers"
      eyebrow="Customer onboarding"
      title="Create customer profile"
      description="Add a customer record with identity, contact, and baseline risk details before starting verification and screening flows."
      icon={UsersIcon}
      formTitle="Customer intake"
      formDescription="Capture core identity and risk inputs once so the rest of the compliance workflow inherits clean, consistent source data."
      facts={[
        {
          label: "Workspace",
          value: tenantContext?.tenantName ?? "Preview",
          detail: tenantContext?.tenantSlug ?? "No tenant session",
        },
        {
          label: "Access",
          value: canCreateCustomers ? "Create" : "Review",
          detail: canCreateCustomers ? "New records enabled" : "Read-only role",
        },
        {
          label: "Next stage",
          value: "Verify",
          detail: "Start a verification session after save",
        },
      ]}
      notices={notices}
      railEyebrow="Checklist"
      railTitle="Before you save"
      railDescription="Tight intake quality reduces downstream false positives and manual rework."
      steps={[
        {
          title: "Validate legal identity",
          detail: "Confirm first and last name match the onboarding source document.",
          icon: UsersIcon,
        },
        {
          title: "Use normalized geography",
          detail: "Keep the country field in ISO format for screening and reporting consistency.",
          icon: GlobeIcon,
        },
        {
          title: "Set baseline risk",
          detail: "Choose an initial risk level so verification and case routing start with the right posture.",
          icon: ShieldCheckIcon,
        },
      ]}
      railLink={{ href: "/verifications/new", label: "Start verification next" }}
      visual={{
        src: "/customer-onboarding-visual.svg",
        alt: "Customer and verification workflow illustration",
      }}
    >
      <CreateCustomerForm disabled={!isSupabaseEnabled || !canCreateCustomers} />
    </WorkflowShell>
  );
}
