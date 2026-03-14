import Link from "next/link";
import { ListChecksIcon } from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { listCases, listComplianceOfficers } from "@/modules/cases/repository";
import { CASE_PRIORITIES, CASE_STATUSES } from "@/modules/cases/types";
import { caseFiltersSchema } from "@/modules/cases/validation";

export const metadata = {
  title: "Cases | SmartCompliance",
};

type CasesPageProps = {
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
    case "resolved":
    case "closed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "in_review":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-sky-200 bg-sky-50 text-sky-700";
  }
}

function priorityClass(value: string) {
  switch (value) {
    case "critical":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "high":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "medium":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}

export default async function CasesPage({ searchParams }: CasesPageProps) {
  const params = searchParams ? await searchParams : {};
  const parsedFilters = caseFiltersSchema.safeParse({
    q: typeof params.q === "string" ? params.q : params.q?.[0],
    status: typeof params.status === "string" ? params.status : params.status?.[0],
    priority:
      typeof params.priority === "string" ? params.priority : params.priority?.[0],
    assignedTo:
      typeof params.assignedTo === "string"
        ? params.assignedTo
        : params.assignedTo?.[0],
  });
  const filters = parsedFilters.success
    ? {
        query: parsedFilters.data.q,
        status: parsedFilters.data.status,
        priority: parsedFilters.data.priority,
        assignedTo: parsedFilters.data.assignedTo,
      }
    : {
        query: undefined,
        status: undefined,
        priority: undefined,
        assignedTo: undefined,
      };

  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;
  const canManage = tenantContext ? canManageTenant(tenantContext.role) : false;

  let cases: Awaited<ReturnType<typeof listCases>> = [];
  let officers: Awaited<ReturnType<typeof listComplianceOfficers>> = [];

  if (isSupabaseEnabled && tenantContext) {
    const supabase = await createClient();
    [cases, officers] = await Promise.all([
      listCases(
        {
          supabase,
          tenantId: tenantContext.tenantId,
        },
        filters,
      ),
      listComplianceOfficers({
        supabase,
        tenantId: tenantContext.tenantId,
      }),
    ]);
  }

  const hasActiveFilters = Boolean(
    filters.query || filters.status || filters.priority || filters.assignedTo,
  );
  const openCount = cases.filter((item) => item.status === "open").length;
  const reviewCount = cases.filter((item) => item.status === "in_review").length;
  const closedCount = cases.filter(
    (item) => item.status === "resolved" || item.status === "closed",
  ).length;

  return (
    <section className="space-y-6">
      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex rounded-xl bg-ink p-2 text-shell">
                <ListChecksIcon />
              </span>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Case review</p>
            </div>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl leading-tight text-ink md:text-5xl">
              Cases
            </h1>
            <p className="mt-2 text-sm leading-7 text-ink/70">
              Manual review queue for risk and monitoring escalations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={canManage ? "/cases/new" : "/cases"}
              aria-disabled={!canManage}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                canManage
                  ? "bg-ink text-shell hover:bg-ink/92"
                  : "cursor-not-allowed border border-ink/15 text-ink/45"
              }`}
            >
              New case
            </Link>
            <Link
              href={canManage ? "/cases/update" : "/cases"}
              aria-disabled={!canManage}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                canManage
                  ? "border-ink/20 text-ink hover:border-ink/35 hover:bg-white"
                  : "cursor-not-allowed border-ink/15 text-ink/45"
              }`}
            >
              Update case
            </Link>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <article className="rounded-[1rem] border border-ink/10 bg-white/88 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-ink/52">Open</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{openCount}</p>
          </article>
          <article className="rounded-[1rem] border border-ink/10 bg-white/88 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-ink/52">In review</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{reviewCount}</p>
          </article>
          <article className="rounded-[1rem] border border-ink/10 bg-white/88 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-ink/52">Resolved</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{closedCount}</p>
          </article>
        </div>
      </article>

      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-ink/52">Case queue</p>
            <p className="mt-2 text-sm text-ink/70">
              Filter by status, priority, assignee, or search text.
            </p>
          </div>
          <form className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_130px_130px_170px_auto_auto]">
            <input
              name="q"
              defaultValue={filters.query ?? ""}
              className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-ink/35"
              placeholder="Search customer or case"
            />
            <select
              name="status"
              defaultValue={filters.status ?? ""}
              className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-ink/35"
            >
              <option value="">All status</option>
              {CASE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
            <select
              name="priority"
              defaultValue={filters.priority ?? ""}
              className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-ink/35"
            >
              <option value="">All priority</option>
              {CASE_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {formatLabel(priority)}
                </option>
              ))}
            </select>
            <select
              name="assignedTo"
              defaultValue={filters.assignedTo ?? ""}
              className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-ink/35"
            >
              <option value="">Any assignee</option>
              {officers.map((officer) => (
                <option key={officer.id} value={officer.id}>
                  {officer.fullName ?? officer.email}
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
                href="/cases"
                className="rounded-xl border border-ink/15 px-4 py-2.5 text-center text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white"
              >
                Reset
              </Link>
            ) : null}
          </form>
        </div>

        <div className="mt-6 overflow-hidden rounded-[1.2rem] border border-ink/10 bg-white/88">
          <div className="hidden border-b border-ink/10 bg-shell/70 px-4 py-3 text-xs uppercase tracking-[0.24em] text-ink/52 md:grid md:grid-cols-[1.8fr_110px_110px_1fr_120px_120px]">
            <p>Case</p>
            <p>Status</p>
            <p>Priority</p>
            <p>Assignee</p>
            <p>Decision</p>
            <p>Updated</p>
          </div>
          {cases.length > 0 ? (
            cases.map((item) => (
              <article
                key={item.id}
                className="border-b border-ink/8 px-4 py-4 last:border-b-0 md:grid md:grid-cols-[1.8fr_110px_110px_1fr_120px_120px] md:items-center md:gap-3"
              >
                <div>
                  <p className="font-semibold text-ink">{item.customerName}</p>
                  <p className="mt-1 text-xs text-ink/55">
                    Case {item.id.slice(0, 8)} • Session{" "}
                    {item.verificationSessionId?.slice(0, 8) ?? "--"}
                  </p>
                </div>
                <div className="mt-2 md:mt-0">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${statusClass(
                      item.status,
                    )}`}
                  >
                    {formatLabel(item.status)}
                  </span>
                </div>
                <div className="mt-2 md:mt-0">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${priorityClass(
                      item.priority,
                    )}`}
                  >
                    {formatLabel(item.priority)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink/68 md:mt-0">
                  {item.assignedOfficerName ?? "Unassigned"}
                </p>
                <p className="mt-2 text-sm text-ink/68 md:mt-0">
                  {item.resolutionDecision ? formatLabel(item.resolutionDecision) : "--"}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink/54 md:mt-0">
                  {formatDate(item.updatedAt)}
                </p>
              </article>
            ))
          ) : (
            <div className="px-4 py-8 text-sm text-ink/68">
              No cases matched these filters.
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
