import Link from "next/link";
import { ActivityIcon, PlusCircleIcon } from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { listRules } from "@/modules/rules/repository";
import type { RuleCondition, RuleRecord } from "@/modules/rules/types";
import { ruleFiltersSchema } from "@/modules/rules/validation";

export const metadata = {
  title: "Rules | SmartCompliance",
};

type RulesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function conditionSummary(condition: RuleCondition) {
  const parts: string[] = [];

  if (condition.watchlistStatusIn && condition.watchlistStatusIn.length > 0) {
    parts.push(`Watchlist in [${condition.watchlistStatusIn.join(", ")}]`);
  }

  if (condition.missingDocuments) {
    parts.push("Missing documents");
  }

  if (condition.minDocumentConfidence !== undefined) {
    parts.push(`Doc confidence >= ${condition.minDocumentConfidence}`);
  }

  if (condition.maxDocumentConfidence !== undefined) {
    parts.push(`Doc confidence <= ${condition.maxDocumentConfidence}`);
  }

  return parts.length > 0 ? parts.join(" • ") : "Always applies";
}

export default async function RulesPage({ searchParams }: RulesPageProps) {
  const params = searchParams ? await searchParams : {};
  const parsedFilters = ruleFiltersSchema.safeParse({
    q: typeof params.q === "string" ? params.q : params.q?.[0],
    enabled:
      typeof params.enabled === "string" ? params.enabled : params.enabled?.[0],
  });

  const filters = parsedFilters.success
    ? {
        query: parsedFilters.data.q,
        enabled: parsedFilters.data.enabled,
      }
    : {
        query: undefined,
        enabled: undefined,
      };

  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;
  const canManage = tenantContext ? canManageTenant(tenantContext.role) : false;
  let rules: RuleRecord[] = [];

  if (isSupabaseEnabled && tenantContext) {
    rules = await listRules(
      {
        supabase: await createClient(),
        tenantId: tenantContext.tenantId,
      },
      filters,
    );
  }

  const hasActiveFilters =
    filters.query !== undefined || filters.enabled !== undefined;
  const enabledCount = rules.filter((rule) => rule.enabled).length;
  const disabledCount = rules.length - enabledCount;

  return (
    <section className="space-y-6">
      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex rounded-xl bg-ink p-2 text-shell">
                <ActivityIcon />
              </span>
              <p className="app-kicker">Risk policy</p>
            </div>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl leading-tight text-ink md:text-5xl">
              Rules
            </h1>
            <p className="mt-2 text-sm leading-7 text-ink/70">
              Configure tenant risk rules used by the decision engine.
            </p>
          </div>
          {canManage ? (
            <Link
              href="/rules/new"
              className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-[11px]"
            >
              <PlusCircleIcon className="h-4 w-4" />
              New rule
            </Link>
          ) : null}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <article className="rounded-[1rem] border border-ink/10 bg-white/90 p-4">
            <p className="app-kicker">Total rules</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{rules.length}</p>
          </article>
          <article className="rounded-[1rem] border border-ink/10 bg-white/90 p-4">
            <p className="app-kicker">Enabled</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{enabledCount}</p>
          </article>
          <article className="rounded-[1rem] border border-ink/10 bg-white/90 p-4">
            <p className="app-kicker">Disabled</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{disabledCount}</p>
          </article>
        </div>
      </article>

      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="app-kicker">Rule set</p>
            <p className="mt-2 text-sm leading-7 text-ink/70">
              Search by name or filter by enabled status.
            </p>
          </div>
          <form className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_170px_auto_auto]">
            <input
              name="q"
              defaultValue={filters.query ?? ""}
              className="field-input py-[0.62rem]"
              placeholder="Search rule name"
            />
            <select
              name="enabled"
              defaultValue={
                filters.enabled === undefined ? "" : filters.enabled ? "true" : "false"
              }
              className="field-input py-[0.62rem]"
            >
              <option value="">All statuses</option>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
            <button
              type="submit"
              className="btn-primary px-4 py-2 text-[11px]"
            >
              Apply
            </button>
            {hasActiveFilters ? (
              <Link
                href="/rules"
                className="btn-secondary px-4 py-2 text-[11px]"
              >
                Reset
              </Link>
            ) : null}
          </form>
        </div>

        <p className="mt-6 text-sm text-ink/62">
          Showing <span className="font-semibold text-ink">{rules.length}</span> risk rules.
        </p>

        <div className="mt-3 overflow-hidden rounded-[1.2rem] border border-ink/12 bg-white/90">
          <div className="hidden border-b border-ink/10 bg-ink/[0.035] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/55 md:grid md:grid-cols-[2fr_2fr_80px_130px_90px_110px_90px]">
            <p>Rule</p>
            <p>Condition</p>
            <p>Score</p>
            <p>Decision</p>
            <p>Status</p>
            <p>Updated</p>
            <p>Action</p>
          </div>
          {rules.length > 0 ? (
            rules.map((rule) => (
              <article
                key={rule.id}
                className="border-b border-ink/8 px-4 py-4 transition-colors hover:bg-signal/15 last:border-b-0 md:grid md:grid-cols-[2fr_2fr_80px_130px_90px_110px_90px] md:items-center md:gap-3"
              >
                <div>
                  <p className="font-semibold text-ink">{rule.name}</p>
                  <p className="mt-1 text-xs text-ink/55">
                    {rule.description ?? "No description"} • v{rule.version}
                  </p>
                </div>
                <p className="mt-2 text-xs leading-6 text-ink/65 md:mt-0">
                  {conditionSummary(rule.condition)}
                </p>
                <p className="mt-2 text-sm text-ink/70 md:mt-0">{rule.score}</p>
                <p className="mt-2 text-sm text-ink/70 md:mt-0">
                  {rule.decisionAction ? formatLabel(rule.decisionAction) : "--"}
                </p>
                <p className="mt-2 md:mt-0">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                      rule.enabled
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {rule.enabled ? "Enabled" : "Disabled"}
                  </span>
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink/54 md:mt-0">
                  {formatDate(rule.updatedAt)}
                </p>
                <div className="mt-2 md:mt-0">
                  {canManage ? (
                    <Link
                      href={`/rules/${rule.id}/edit`}
                      className="btn-secondary px-3 py-1.5 text-[10px]"
                    >
                      Edit
                    </Link>
                  ) : (
                    <span className="text-xs uppercase tracking-[0.18em] text-ink/40">
                      View
                    </span>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="px-4 py-8 text-sm text-ink/68">
              No rules found for this workspace.
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
