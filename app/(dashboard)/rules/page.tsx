import { ActivityIcon } from "@/components/ui/icons";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Rules | SmartCompliance",
};

type RuleRow = {
  id: string;
  name: string;
  description: string | null;
  score: number;
  decision_action: "approved" | "rejected" | "manual_review" | null;
  enabled: boolean;
  version: number;
  updated_at: string;
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

export default async function RulesPage() {
  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;
  let rules: RuleRow[] = [];

  if (isSupabaseEnabled && tenantContext) {
    const { data } = await (await createClient())
      .from("rules")
      .select("id, name, description, score, decision_action, enabled, version, updated_at")
      .eq("tenant_id", tenantContext.tenantId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(120);

    rules = (data ?? []) as RuleRow[];
  }

  return (
    <section className="space-y-6">
      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-xl bg-ink p-2 text-shell">
            <ActivityIcon />
          </span>
          <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Risk policy</p>
        </div>
        <h1 className="mt-4 font-[var(--font-display)] text-4xl leading-tight text-ink md:text-5xl">
          Rules
        </h1>
        <p className="mt-2 text-sm leading-7 text-ink/70">
          Tenant risk rules used by the decision engine.
        </p>
      </article>

      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="overflow-hidden rounded-[1.2rem] border border-ink/10 bg-white/88">
          <div className="hidden border-b border-ink/10 bg-shell/70 px-4 py-3 text-xs uppercase tracking-[0.24em] text-ink/52 md:grid md:grid-cols-[2fr_90px_130px_90px_110px]">
            <p>Rule</p>
            <p>Score</p>
            <p>Decision</p>
            <p>Status</p>
            <p>Updated</p>
          </div>
          {rules.length > 0 ? (
            rules.map((rule) => (
              <article
                key={rule.id}
                className="border-b border-ink/8 px-4 py-4 last:border-b-0 md:grid md:grid-cols-[2fr_90px_130px_90px_110px] md:items-center md:gap-3"
              >
                <div>
                  <p className="font-semibold text-ink">{rule.name}</p>
                  <p className="mt-1 text-xs text-ink/55">
                    {rule.description ?? "No description"} • v{rule.version}
                  </p>
                </div>
                <p className="mt-2 text-sm text-ink/70 md:mt-0">{rule.score}</p>
                <p className="mt-2 text-sm text-ink/70 md:mt-0">
                  {rule.decision_action ? formatLabel(rule.decision_action) : "--"}
                </p>
                <p className="mt-2 text-sm text-ink/70 md:mt-0">
                  {rule.enabled ? "Enabled" : "Disabled"}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink/54 md:mt-0">
                  {formatDate(rule.updated_at)}
                </p>
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
