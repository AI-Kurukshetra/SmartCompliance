import Link from "next/link";
import { ShieldCheckIcon } from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { listRiskProfiles } from "@/modules/risk/repository";
import {
  listVerificationDocuments,
  listVerificationSessions,
} from "@/modules/verifications/repository";
import { VERIFICATION_STATUSES } from "@/modules/verifications/types";
import { verificationFiltersSchema } from "@/modules/verifications/validation";
import { listWatchlistResults } from "@/modules/watchlist/repository";

export const metadata = {
  title: "Verifications | SmartCompliance",
};

type VerificationsPageProps = {
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

function statusClass(value: string) {
  switch (value) {
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "rejected":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "review":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-sky-200 bg-sky-50 text-sky-700";
  }
}

export default async function VerificationsPage({
  searchParams,
}: VerificationsPageProps) {
  const params = searchParams ? await searchParams : {};
  const parsedFilters = verificationFiltersSchema.safeParse({
    q: typeof params.q === "string" ? params.q : params.q?.[0],
    status: typeof params.status === "string" ? params.status : params.status?.[0],
  });
  const filters = parsedFilters.success
    ? {
        query: parsedFilters.data.q,
        status: parsedFilters.data.status,
      }
    : {
        query: undefined,
        status: undefined,
      };

  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;
  const canManage = tenantContext ? canManageTenant(tenantContext.role) : false;

  let sessions: Awaited<ReturnType<typeof listVerificationSessions>> = [];
  let documents: Awaited<ReturnType<typeof listVerificationDocuments>> = [];
  let watchlistResults: Awaited<ReturnType<typeof listWatchlistResults>> = [];
  let riskProfiles: Awaited<ReturnType<typeof listRiskProfiles>> = [];

  if (isSupabaseEnabled && tenantContext) {
    const supabase = await createClient();
    [sessions, documents, watchlistResults, riskProfiles] = await Promise.all([
      listVerificationSessions(
        {
          supabase,
          tenantId: tenantContext.tenantId,
        },
        filters,
      ),
      listVerificationDocuments(
        {
          supabase,
          tenantId: tenantContext.tenantId,
        },
        {},
      ),
      listWatchlistResults(
        {
          supabase,
          tenantId: tenantContext.tenantId,
        },
        {},
      ),
      listRiskProfiles(
        {
          supabase,
          tenantId: tenantContext.tenantId,
        },
        {},
      ),
    ]);
  }

  const hasActiveFilters = Boolean(filters.query || filters.status);
  const avgConfidence =
    documents.length > 0
      ? Math.round(
          documents
            .filter((item) => typeof item.documentConfidence === "number")
            .reduce((sum, item) => sum + (item.documentConfidence ?? 0), 0) /
            Math.max(
              documents.filter((item) => typeof item.documentConfidence === "number")
                .length,
              1,
            ),
        )
      : 0;

  return (
    <section className="space-y-6">
      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex rounded-xl bg-ink p-2 text-shell">
                <ShieldCheckIcon />
              </span>
              <p className="app-kicker">Verification pipeline</p>
            </div>
            <h1 className="font-[var(--font-display)] text-4xl leading-tight text-ink md:text-5xl">
              Verifications
            </h1>
            <p className="mt-2 text-sm leading-7 text-ink/70">
              Session orchestration with document processing, screening, and
              decision tracking.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={canManage ? "/verifications/new" : "/verifications"}
              aria-disabled={!canManage}
              className={`px-4 py-2 text-[11px] ${
                canManage
                  ? "btn-primary"
                  : "btn-secondary cursor-not-allowed border-ink/15 text-ink/45 opacity-50"
              }`}
            >
              New session
            </Link>
            <Link
              href={canManage ? "/verifications/upload" : "/verifications"}
              aria-disabled={!canManage}
              className={`px-4 py-2 text-[11px] ${
                canManage
                  ? "btn-secondary"
                  : "btn-secondary cursor-not-allowed border-ink/15 text-ink/45 opacity-50"
              }`}
            >
              Upload document
            </Link>
            <Link
              href={canManage ? "/verifications/screening" : "/verifications"}
              aria-disabled={!canManage}
              className={`px-4 py-2 text-[11px] ${
                canManage
                  ? "btn-secondary"
                  : "btn-secondary cursor-not-allowed border-ink/15 text-ink/45 opacity-50"
              }`}
            >
              Run screening
            </Link>
            <Link
              href={canManage ? "/verifications/decision" : "/verifications"}
              aria-disabled={!canManage}
              className={`px-4 py-2 text-[11px] ${
                canManage
                  ? "btn-secondary"
                  : "btn-secondary cursor-not-allowed border-ink/15 text-ink/45 opacity-50"
              }`}
            >
              Run decision
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <article className="rounded-[1rem] border border-ink/10 bg-white/90 p-4">
            <p className="app-kicker">Sessions</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{sessions.length}</p>
          </article>
          <article className="rounded-[1rem] border border-ink/10 bg-white/90 p-4">
            <p className="app-kicker">Documents</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{documents.length}</p>
          </article>
          <article className="rounded-[1rem] border border-ink/10 bg-white/90 p-4">
            <p className="app-kicker">Screenings</p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {watchlistResults.length}
            </p>
          </article>
          <article className="rounded-[1rem] border border-ink/10 bg-white/90 p-4">
            <p className="app-kicker">Avg OCR confidence</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{avgConfidence}%</p>
          </article>
        </div>
      </article>

      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="app-kicker">Session queue</p>
            <p className="mt-2 text-sm text-ink/70">
              Filter sessions by customer name/email and verification status.
            </p>
          </div>
          <form className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_180px_auto_auto]">
            <input
              name="q"
              defaultValue={filters.query ?? ""}
              className="field-input py-[0.62rem]"
              placeholder="Search customer"
            />
            <select
              name="status"
              defaultValue={filters.status ?? ""}
              className="field-input py-[0.62rem]"
            >
              <option value="">All statuses</option>
              {VERIFICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="btn-primary px-4 py-2 text-[11px]"
            >
              Apply
            </button>
            {hasActiveFilters ? (
              <Link
                href="/verifications"
                className="btn-secondary px-4 py-2 text-[11px]"
              >
                Reset
              </Link>
            ) : null}
          </form>
        </div>

        {!isSupabaseEnabled ? (
          <p className="mt-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Supabase environment variables are missing, so verification data is in
            preview mode.
          </p>
        ) : null}

        <p className="mt-6 text-sm text-ink/62">
          Showing <span className="font-semibold text-ink">{sessions.length}</span> verification
          sessions.
        </p>

        <div className="mt-3 overflow-hidden rounded-[1.2rem] border border-ink/12 bg-white/90">
          <div className="hidden border-b border-ink/10 bg-ink/[0.035] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/55 md:grid md:grid-cols-[2fr_120px_120px_110px_120px_120px]">
            <p>Customer</p>
            <p>Status</p>
            <p>Decision</p>
            <p>Risk</p>
            <p>Started</p>
            <p>Outputs</p>
          </div>
          {sessions.length > 0 ? (
            sessions.map((session) => {
              const docsCount = documents.filter(
                (item) => item.verificationSessionId === session.id,
              ).length;
              const screeningsCount = watchlistResults.filter(
                (item) => item.verificationSessionId === session.id,
              ).length;
              const hasRiskProfile = riskProfiles.some(
                (item) => item.verificationSessionId === session.id,
              );

              return (
                <article
                  key={session.id}
                  className="border-b border-ink/8 px-4 py-4 transition-colors hover:bg-signal/15 last:border-b-0 md:grid md:grid-cols-[2fr_120px_120px_110px_120px_120px] md:items-center md:gap-3"
                >
                  <div>
                    <p className="font-semibold text-ink">{session.customerName}</p>
                    <p className="mt-1 text-xs text-ink/55">
                      {session.customerEmail ?? "No email"} • {session.id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${statusClass(
                        session.status,
                      )}`}
                    >
                      {formatLabel(session.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink/68 md:mt-0">
                    {formatLabel(session.decision)}
                  </p>
                  <p className="mt-2 text-sm text-ink/68 md:mt-0">
                    {session.riskScore}/100
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink/54 md:mt-0">
                    {formatDate(session.startedAt)}
                  </p>
                  <p className="mt-2 text-xs text-ink/62 md:mt-0">
                    D:{docsCount} / S:{screeningsCount} / R:{hasRiskProfile ? "yes" : "no"}
                  </p>
                </article>
              );
            })
          ) : (
            <div className="px-4 py-8 text-sm text-ink/68">
              No verification sessions matched these filters.
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
