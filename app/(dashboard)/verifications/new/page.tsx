import { CreateSessionForm } from "@/components/verifications/create-session-form";
import { WorkflowShell } from "@/components/dashboard/workflow-shell";
import {
  ListChecksIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { listCustomers } from "@/modules/customers/repository";

export const metadata = {
  title: "New Verification Session | SmartCompliance",
};

export default async function NewVerificationSessionPage() {
  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;
  const canManage = tenantContext ? canManageTenant(tenantContext.role) : false;

  const customers =
    isSupabaseEnabled && tenantContext
      ? await listCustomers(
          {
            supabase: await createClient(),
            tenantId: tenantContext.tenantId,
          },
          {},
        )
      : [];

  const customerOptions = customers.map((customer) => ({
    id: customer.id,
    label: `${customer.firstName} ${customer.lastName} (${customer.email ?? "no email"})`,
  }));
  const notices = [];

  if (!isSupabaseEnabled) {
    notices.push({
      tone: "info" as const,
      message:
        "Supabase environment variables are missing, so verification session creation is disabled.",
    });
  }

  if (isSupabaseEnabled && tenantContext && !canManage) {
    notices.push({
      tone: "warning" as const,
      message: "Your role can review verification data but cannot start new sessions.",
    });
  }

  if (isSupabaseEnabled && canManage && customerOptions.length === 0) {
    notices.push({
      tone: "info" as const,
      message: "No customers are available yet. Create a customer record before launching a session.",
    });
  }

  return (
    <WorkflowShell
      backHref="/verifications"
      backLabel="Back to verifications"
      eyebrow="Verification setup"
      title="Start verification session"
      description="Select a customer to initialize the workflow record that anchors document upload, screening, and decisioning."
      icon={UsersIcon}
      formTitle="Session launch"
      formDescription="Every verification run starts here. Choose the customer record that should receive documents, screening results, and risk decisions."
      facts={[
        {
          label: "Customers",
          value: `${customerOptions.length}`,
          detail:
            customerOptions.length > 0 ? "Profiles ready for verification" : "Create intake data first",
        },
        {
          label: "Access",
          value: canManage ? "Launch" : "Review",
          detail: canManage ? "New sessions enabled" : "Execution disabled",
        },
        {
          label: "Output",
          value: "Session",
          detail: "Creates the workflow container",
        },
      ]}
      notices={notices}
      railEyebrow="Launch sequence"
      railTitle="What happens next"
      railDescription="The session becomes the shared control record for evidence, watchlist checks, and automated decisions."
      steps={[
        {
          title: "Select the customer",
          detail: "Use the exact onboarding record that should own the verification journey.",
          icon: UsersIcon,
        },
        {
          title: "Open the session",
          detail: "Create the tenant-scoped verification container before adding evidence.",
          icon: ListChecksIcon,
        },
        {
          title: "Continue into review",
          detail: "Upload documents, run screening, and score risk against the same session.",
          icon: ShieldCheckIcon,
        },
      ]}
      railLink={{ href: "/verifications/upload", label: "Upload evidence after creation" }}
      visual={{
        src: "/compliance-grid-visual.svg",
        alt: "Compliance workflow illustration",
      }}
    >
      <CreateSessionForm
        disabled={!isSupabaseEnabled || !canManage}
        customers={customerOptions}
      />
    </WorkflowShell>
  );
}
