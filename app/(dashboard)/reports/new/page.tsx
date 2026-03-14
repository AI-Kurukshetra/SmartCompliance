import Link from "next/link";
import { GenerateReportForm } from "@/components/reports/generate-report-form";
import { FileChartIcon } from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";

export const metadata = {
  title: "Generate Report | SmartCompliance",
};

export default async function GenerateReportPage() {
  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;
  const canManage = tenantContext ? canManageTenant(tenantContext.role) : false;

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-xl bg-ink p-2 text-shell">
            <FileChartIcon />
          </span>
          <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Regulatory output</p>
        </div>
        <h1 className="mt-4 font-[var(--font-display)] text-4xl leading-tight text-ink">
          Generate a report
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink/72">
          Build SAR, CTR, audit, or operations report payloads for export.
        </p>
      </article>

      <article className="panel rounded-[2rem] p-6 md:p-8">
        <GenerateReportForm disabled={!isSupabaseEnabled || !canManage} />
        <div className="mt-6">
          <Link
            href="/reports"
            className="inline-flex rounded-xl border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white"
          >
            Back to reports
          </Link>
        </div>
      </article>
    </section>
  );
}
