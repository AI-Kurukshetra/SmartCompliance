import { notFound } from "next/navigation";
import { UpdateCustomerForm } from "@/components/customers/update-customer-form";
import { WorkflowShell } from "@/components/dashboard/workflow-shell";
import {
  GlobeIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getCustomerById } from "@/modules/customers/repository";

export const metadata = {
  title: "Edit Customer | SmartCompliance",
};

type EditCustomerPageProps = {
  params: Promise<{
    customerId: string;
  }>;
};

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { customerId } = await params;
  const isSupabaseEnabled = hasSupabaseEnv();

  if (!isSupabaseEnabled) {
    notFound();
  }

  const tenantContext = await getTenantContext();

  if (!tenantContext) {
    notFound();
  }

  const canEditCustomers = canManageTenant(tenantContext.role);
  let customer: Awaited<ReturnType<typeof getCustomerById>>;

  try {
    customer = await getCustomerById(
      {
        supabase: await createClient(),
        tenantId: tenantContext.tenantId,
      },
      customerId,
    );
  } catch {
    notFound();
  }

  const notices = [];

  if (!canEditCustomers) {
    notices.push({
      tone: "warning" as const,
      message: "Your role can review customer data but cannot edit records.",
    });
  }

  return (
    <WorkflowShell
      backHref="/customers"
      backLabel="Back to customers"
      eyebrow="Customer maintenance"
      title="Edit customer profile"
      description={`Updating ${customer.firstName} ${customer.lastName}. Save changes to refresh risk and contact details across verification, monitoring, and case workflows.`}
      icon={UsersIcon}
      formTitle="Profile maintenance"
      formDescription="Use this form to keep the customer record aligned with current evidence and downstream screening signals."
      facts={[
        {
          label: "Customer",
          value: `${customer.firstName} ${customer.lastName}`,
          detail: `ID ${customer.id.slice(0, 8)}`,
        },
        {
          label: "Risk",
          value: customer.riskLevel.charAt(0).toUpperCase() + customer.riskLevel.slice(1),
          detail: "Current customer posture",
        },
        {
          label: "Access",
          value: canEditCustomers ? "Edit" : "Review",
          detail: canEditCustomers ? "Changes can be saved" : "Update action disabled",
        },
      ]}
      notices={notices}
      railEyebrow="Update cues"
      railTitle="Keep this record sharp"
      railDescription="Customer profile changes ripple into verifications, cases, and monitoring. Update deliberately."
      steps={[
        {
          title: "Match legal spelling",
          detail: "Keep the name aligned with the latest verified identity source.",
          icon: UsersIcon,
        },
        {
          title: "Refresh contact fields",
          detail: "Synchronize geography and outreach details with the latest onboarding data.",
          icon: GlobeIcon,
        },
        {
          title: "Escalate risk changes",
          detail: "Raise the baseline posture when new screening evidence or alerts justify it.",
          icon: ShieldCheckIcon,
        },
      ]}
      railLink={{ href: "/cases/new", label: "Create linked case" }}
      visual={{
        src: "/customer-onboarding-visual.svg",
        alt: "Customer profile workflow illustration",
      }}
    >
        <UpdateCustomerForm customer={customer} disabled={!canEditCustomers} />
    </WorkflowShell>
  );
}
