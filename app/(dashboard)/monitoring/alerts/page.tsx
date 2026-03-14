import Link from "next/link";
import { UpdateAlertForm } from "@/components/transactions/update-alert-form";
import { ListChecksIcon } from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { listAlerts } from "@/modules/transactions/repository";

export const metadata = {
  title: "Update Alert Status | SmartCompliance",
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default async function UpdateAlertStatusPage() {
  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;
  const canManage = tenantContext ? canManageTenant(tenantContext.role) : false;

  const alerts =
    isSupabaseEnabled && tenantContext
      ? await listAlerts(
          {
            supabase: await createClient(),
            tenantId: tenantContext.tenantId,
          },
          {},
        )
      : [];

  const alertOptions = alerts.map((alert) => ({
    id: alert.id,
    label: `${formatLabel(alert.alertType)} • ${alert.customerName} • ${formatLabel(alert.status)}`,
  }));

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-xl bg-ink p-2 text-shell">
            <ListChecksIcon />
          </span>
          <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Alert workflow</p>
        </div>
        <h1 className="mt-4 font-[var(--font-display)] text-4xl leading-tight text-ink">
          Update alert status
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink/72">
          Transition alerts to acknowledged or resolved after review.
        </p>
      </article>

      <article className="panel rounded-[2rem] p-6 md:p-8">
        <UpdateAlertForm disabled={!isSupabaseEnabled || !canManage} alerts={alertOptions} />
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
