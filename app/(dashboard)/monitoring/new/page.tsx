import { IngestTransactionForm } from "@/components/transactions/ingest-transaction-form";
import { WorkflowShell } from "@/components/dashboard/workflow-shell";
import {
  ActivityIcon,
  ListChecksIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { listCustomers } from "@/modules/customers/repository";

export const metadata = {
  title: "Ingest Transaction | SmartCompliance",
};

export default async function NewTransactionPage() {
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
        "Supabase environment variables are missing, so transaction ingestion is disabled.",
    });
  }

  if (isSupabaseEnabled && tenantContext && !canManage) {
    notices.push({
      tone: "warning" as const,
      message: "Your role can review monitoring data but cannot ingest new transactions.",
    });
  }

  if (isSupabaseEnabled && canManage && customerOptions.length === 0) {
    notices.push({
      tone: "info" as const,
      message: "No customers are available yet. Create a customer before submitting monitored transactions.",
    });
  }

  return (
    <WorkflowShell
      backHref="/monitoring"
      backLabel="Back to monitoring"
      eyebrow="Monitoring intake"
      title="Ingest transaction"
      description="Submit a transaction to run suspicious-pattern checks, customer-level rules, and alert generation."
      icon={ActivityIcon}
      formTitle="Transaction intake"
      formDescription="Route a new transaction into the monitoring pipeline with the customer, amount, type, and geography needed for alert logic."
      facts={[
        {
          label: "Customers",
          value: `${customerOptions.length}`,
          detail: customerOptions.length > 0 ? "Available for attribution" : "Create intake data first",
        },
        {
          label: "Access",
          value: canManage ? "Ingest" : "Review",
          detail: canManage ? "Monitoring intake enabled" : "Execution disabled",
        },
        {
          label: "Output",
          value: "Alerts",
          detail: "Pattern checks and alert creation",
        },
      ]}
      notices={notices}
      railEyebrow="Monitoring runbook"
      railTitle="Stream discipline"
      railDescription="Consistent attribution and transaction typing are what make monitoring signals explainable later."
      steps={[
        {
          title: "Attach the right customer",
          detail: "Use the correct customer record so transaction history stays tenant-scoped and traceable.",
          icon: UsersIcon,
        },
        {
          title: "Describe the movement",
          detail: "Enter amount, currency, type, and country in the format expected by alert logic.",
          icon: ActivityIcon,
        },
        {
          title: "Review generated outcomes",
          detail: "Flagged patterns will surface into the alert queue for analyst action.",
          icon: ListChecksIcon,
        },
      ]}
      railLink={{ href: "/monitoring/alerts", label: "Update alert statuses next" }}
      visual={{
        src: "/landing-compliance-visual.svg",
        alt: "Monitoring intake workflow illustration",
      }}
    >
      <IngestTransactionForm
        disabled={!isSupabaseEnabled || !canManage}
        customers={customerOptions}
      />
    </WorkflowShell>
  );
}
