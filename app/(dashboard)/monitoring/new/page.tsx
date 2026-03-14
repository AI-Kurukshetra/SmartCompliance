import Link from "next/link";
import { IngestTransactionForm } from "@/components/transactions/ingest-transaction-form";
import { ActivityIcon } from "@/components/ui/icons";
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

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-xl bg-ink p-2 text-shell">
            <ActivityIcon />
          </span>
          <p className="text-xs uppercase tracking-[0.3em] text-ink/55">
            Monitoring intake
          </p>
        </div>
        <h1 className="mt-4 font-[var(--font-display)] text-4xl leading-tight text-ink">
          Ingest transaction
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink/72">
          Submit a transaction to run suspicious-pattern checks and alert generation.
        </p>
      </article>

      <article className="panel rounded-[2rem] p-6 md:p-8">
        <IngestTransactionForm
          disabled={!isSupabaseEnabled || !canManage}
          customers={customerOptions}
        />
        <div className="mt-6">
          <Link
            href="/monitoring"
            className="inline-flex rounded-xl border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white"
          >
            Back to monitoring
          </Link>
        </div>
      </article>
    </section>
  );
}
