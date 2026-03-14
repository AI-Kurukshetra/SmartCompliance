import Image from "next/image";
import Link from "next/link";
import { MetricCard } from "@/components/dashboard/metric-card";
import {
  ActivityIcon,
  FileChartIcon,
  ListChecksIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getAnalyticsOverview } from "@/modules/analytics/repository";

export const metadata = {
  title: "Dashboard | SmartCompliance",
};

export default async function DashboardPage() {
  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;

  const overview =
    isSupabaseEnabled && tenantContext
      ? await getAnalyticsOverview({
          supabase: await createClient(),
          tenantId: tenantContext.tenantId,
        })
      : {
          generatedAt: new Date().toISOString(),
          risk: { avgRiskScore: 0, criticalProfiles: 0, highProfiles: 0 },
          fraud: { openAlerts: 0, criticalAlerts: 0, flaggedTransactions: 0 },
          verification: { total: 0, approved: 0, rejected: 0, review: 0 },
          cases: { total: 0, open: 0, inReview: 0, resolved: 0, closed: 0 },
        };

  const metrics = [
    {
      label: "Average risk",
      value: `${overview.risk.avgRiskScore}/100`,
      detail: `Critical: ${overview.risk.criticalProfiles} • High: ${overview.risk.highProfiles}`,
      icon: ShieldCheckIcon,
    },
    {
      label: "Open alerts",
      value: `${overview.fraud.openAlerts}`,
      detail: `Critical: ${overview.fraud.criticalAlerts} • Flagged tx: ${overview.fraud.flaggedTransactions}`,
      icon: ActivityIcon,
    },
    {
      label: "Verification approvals",
      value: `${overview.verification.approved}/${overview.verification.total}`,
      detail: `Review: ${overview.verification.review} • Rejected: ${overview.verification.rejected}`,
      icon: ListChecksIcon,
    },
  ];

  const quickLinks = [
    { href: "/customers/new", label: "Add customer" },
    { href: "/verifications/new", label: "Start verification" },
    { href: "/monitoring/new", label: "Ingest transaction" },
    { href: "/reports/new", label: "Generate report" },
  ];

  return (
    <section className="space-y-6">
      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex rounded-xl bg-ink p-2 text-shell">
                <ActivityIcon />
              </span>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Control center</p>
            </div>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl leading-tight text-ink md:text-5xl">
              Compliance Dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/70">
              Risk, fraud, verification, and case metrics for{" "}
              <strong>{tenantContext?.tenantName ?? "your workspace"}</strong>.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl border border-ink/15 px-3 py-2 text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-[1.3rem] border border-ink/10 bg-white/88 p-3">
            <Image
              src="/compliance-grid-visual.svg"
              alt="Compliance analytics workflow visualization"
              width={1280}
              height={720}
              className="h-auto w-full rounded-[1rem]"
              priority
            />
          </div>
        </div>
      </article>

      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <article className="panel rounded-[1.5rem] p-5">
          <span className="inline-flex rounded-lg bg-ink p-2 text-shell">
            <FileChartIcon className="h-4 w-4" />
          </span>
          <p className="text-xs uppercase tracking-[0.24em] text-ink/52">Cases</p>
          <p className="mt-2 text-sm text-ink/72">
            Open {overview.cases.open}, in review {overview.cases.inReview}, resolved{" "}
            {overview.cases.resolved}.
          </p>
        </article>
        <article className="panel rounded-[1.5rem] p-5">
          <span className="inline-flex rounded-lg bg-ink p-2 text-shell">
            <ActivityIcon className="h-4 w-4" />
          </span>
          <p className="text-xs uppercase tracking-[0.24em] text-ink/52">Fraud</p>
          <p className="mt-2 text-sm text-ink/72">
            {overview.fraud.openAlerts} open alerts with{" "}
            {overview.fraud.flaggedTransactions} flagged transactions.
          </p>
        </article>
        <article className="panel rounded-[1.5rem] p-5">
          <span className="inline-flex rounded-lg bg-ink p-2 text-shell">
            <ShieldCheckIcon className="h-4 w-4" />
          </span>
          <p className="text-xs uppercase tracking-[0.24em] text-ink/52">Risk</p>
          <p className="mt-2 text-sm text-ink/72">
            Score average {overview.risk.avgRiskScore} and {overview.risk.criticalProfiles}{" "}
            critical profiles.
          </p>
        </article>
        <article className="panel rounded-[1.5rem] p-5">
          <span className="inline-flex rounded-lg bg-ink p-2 text-shell">
            <ListChecksIcon className="h-4 w-4" />
          </span>
          <p className="text-xs uppercase tracking-[0.24em] text-ink/52">Updated</p>
          <p className="mt-2 text-sm text-ink/72">
            {new Date(overview.generatedAt).toLocaleString("en-US")}
          </p>
        </article>
      </section>
    </section>
  );
}
