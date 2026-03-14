import Link from "next/link";
import { FileChartIcon } from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { listReports } from "@/modules/reports/repository";
import { REPORT_STATUSES, REPORT_TYPES } from "@/modules/reports/types";
import { reportFiltersSchema } from "@/modules/reports/validation";

export const metadata = {
  title: "Reports | SmartCompliance",
};

type ReportsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function statusClass(status: string) {
  switch (status) {
    case "ready":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "failed":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "processing":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-800";
  }
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = searchParams ? await searchParams : {};
  const parsedFilters = reportFiltersSchema.safeParse({
    reportType:
      typeof params.reportType === "string"
        ? params.reportType
        : params.reportType?.[0],
    status: typeof params.status === "string" ? params.status : params.status?.[0],
  });
  const filters = parsedFilters.success
    ? {
        reportType: parsedFilters.data.reportType,
        status: parsedFilters.data.status,
      }
    : {
        reportType: undefined,
        status: undefined,
      };

  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;
  const canManage = tenantContext ? canManageTenant(tenantContext.role) : false;

  const reports =
    isSupabaseEnabled && tenantContext
      ? await listReports(
          {
            supabase: await createClient(),
            tenantId: tenantContext.tenantId,
          },
          filters,
        )
      : [];

  const hasActiveFilters = Boolean(filters.reportType || filters.status);

  return (
    <section className="space-y-6">
      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex rounded-xl bg-ink p-2 text-shell">
                <FileChartIcon />
              </span>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/55">
                Regulatory reporting
              </p>
            </div>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl leading-tight text-ink md:text-5xl">
              Reports
            </h1>
            <p className="mt-2 text-sm leading-7 text-ink/70">
              Generate SAR, CTR, audit, and operational exports.
            </p>
          </div>
          <Link
            href={canManage ? "/reports/new" : "/reports"}
            aria-disabled={!canManage}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              canManage
                ? "bg-ink text-shell hover:bg-ink/92"
                : "cursor-not-allowed border border-ink/15 text-ink/45"
            }`}
          >
            Generate report
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <article className="rounded-[1rem] border border-ink/10 bg-white/88 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-ink/52">Total jobs</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{reports.length}</p>
          </article>
          <article className="rounded-[1rem] border border-ink/10 bg-white/88 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-ink/52">Ready</p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {reports.filter((item) => item.status === "ready").length}
            </p>
          </article>
          <article className="rounded-[1rem] border border-ink/10 bg-white/88 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-ink/52">Failed</p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {reports.filter((item) => item.status === "failed").length}
            </p>
          </article>
        </div>
      </article>

      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-ink/52">Report jobs</p>
            <p className="mt-2 text-sm text-ink/70">Filter report history and export outputs.</p>
          </div>
          <form className="grid gap-2 sm:grid-cols-[170px_150px_auto_auto]">
            <select
              name="reportType"
              defaultValue={filters.reportType ?? ""}
              className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-ink/35"
            >
              <option value="">All report types</option>
              {REPORT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatLabel(type)}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={filters.status ?? ""}
              className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-ink/35"
            >
              <option value="">All statuses</option>
              {REPORT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-shell transition hover:bg-ink/92"
            >
              Apply
            </button>
            {hasActiveFilters ? (
              <Link
                href="/reports"
                className="rounded-xl border border-ink/15 px-4 py-2.5 text-center text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white"
              >
                Reset
              </Link>
            ) : null}
          </form>
        </div>

        <div className="mt-6 overflow-hidden rounded-[1.2rem] border border-ink/10 bg-white/88">
          <div className="hidden border-b border-ink/10 bg-shell/70 px-4 py-3 text-xs uppercase tracking-[0.24em] text-ink/52 md:grid md:grid-cols-[170px_120px_130px_130px_150px]">
            <p>Type</p>
            <p>Status</p>
            <p>Created</p>
            <p>Completed</p>
            <p>Export</p>
          </div>
          {reports.length > 0 ? (
            reports.map((report) => (
              <article
                key={report.id}
                className="border-b border-ink/8 px-4 py-4 last:border-b-0 md:grid md:grid-cols-[170px_120px_130px_130px_150px] md:items-center md:gap-3"
              >
                <div>
                  <p className="font-semibold text-ink">{formatLabel(report.reportType)}</p>
                  <p className="mt-1 text-xs text-ink/55">{report.id.slice(0, 8)}</p>
                </div>
                <div className="mt-2 md:mt-0">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${statusClass(
                      report.status,
                    )}`}
                  >
                    {formatLabel(report.status)}
                  </span>
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink/54 md:mt-0">
                  {formatDate(report.createdAt)}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink/54 md:mt-0">
                  {formatDate(report.completedAt)}
                </p>
                <div className="mt-2 flex gap-2 md:mt-0">
                  <Link
                    href={`/api/reports/${report.id}/export?format=csv`}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${
                      report.status === "ready"
                        ? "border-ink/15 text-ink hover:border-ink/30 hover:bg-shell"
                        : "pointer-events-none border-ink/8 text-ink/40"
                    }`}
                  >
                    CSV
                  </Link>
                  <Link
                    href={`/api/reports/${report.id}/export?format=pdf`}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${
                      report.status === "ready"
                        ? "border-ink/15 text-ink hover:border-ink/30 hover:bg-shell"
                        : "pointer-events-none border-ink/8 text-ink/40"
                    }`}
                  >
                    PDF
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className="px-4 py-8 text-sm text-ink/68">
              No report jobs matched these filters.
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
