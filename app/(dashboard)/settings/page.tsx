import { CogIcon } from "@/components/ui/icons";
import { getTenantContext } from "@/lib/auth";
import { hasAdminSupabaseEnv, hasSupabaseEnv } from "@/lib/env";

export const metadata = {
  title: "Settings | SmartCompliance",
};

export default async function SettingsPage() {
  const hasPublicEnv = hasSupabaseEnv();
  const hasAdminEnv = hasAdminSupabaseEnv();
  const tenantContext = hasPublicEnv ? await getTenantContext() : null;

  const checks = [
    {
      label: "Public Supabase env",
      value: hasPublicEnv ? "Configured" : "Missing",
      ok: hasPublicEnv,
    },
    {
      label: "Service role key",
      value: hasAdminEnv ? "Configured" : "Missing",
      ok: hasAdminEnv,
    },
    {
      label: "Tenant session",
      value: tenantContext ? "Active" : "Not signed in",
      ok: Boolean(tenantContext),
    },
  ];
  const readyCount = checks.filter((check) => check.ok).length;
  const readiness = Math.round((readyCount / checks.length) * 100);

  return (
    <section className="space-y-6">
      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-xl bg-ink p-2 text-shell">
            <CogIcon />
          </span>
          <p className="app-kicker">Workspace config</p>
        </div>
        <h1 className="mt-4 font-[var(--font-display)] text-4xl leading-tight text-ink md:text-5xl">
          Settings
        </h1>
        <p className="mt-2 text-sm leading-7 text-ink/70">
          Environment, tenant identity, and operational readiness overview.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <article className="rounded-[1rem] border border-ink/10 bg-white/90 p-4">
            <p className="app-kicker">Readiness</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{readiness}%</p>
          </article>
          <article className="rounded-[1rem] border border-ink/10 bg-white/90 p-4">
            <p className="app-kicker">Checks passed</p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {readyCount}/{checks.length}
            </p>
          </article>
          <article className="rounded-[1rem] border border-ink/10 bg-white/90 p-4">
            <p className="app-kicker">Workspace</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {tenantContext?.tenantName ?? "Preview mode"}
            </p>
          </article>
        </div>
      </article>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="panel rounded-[2rem] p-6 md:p-8">
          <p className="app-kicker">Tenant profile</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1rem] border border-ink/10 bg-white/90 p-4">
              <p className="app-kicker">Workspace</p>
              <p className="mt-1.5 text-sm font-semibold text-ink">
                {tenantContext?.tenantName ?? "--"}
              </p>
            </div>
            <div className="rounded-[1rem] border border-ink/10 bg-white/90 p-4">
              <p className="app-kicker">Slug</p>
              <p className="mt-1.5 text-sm font-semibold text-ink">
                {tenantContext?.tenantSlug ?? "--"}
              </p>
            </div>
            <div className="rounded-[1rem] border border-ink/10 bg-white/90 p-4">
              <p className="app-kicker">User</p>
              <p className="mt-1.5 text-sm font-semibold text-ink">
                {tenantContext?.fullName ?? tenantContext?.email ?? "--"}
              </p>
            </div>
            <div className="rounded-[1rem] border border-ink/10 bg-white/90 p-4">
              <p className="app-kicker">Role</p>
              <p className="mt-1.5 text-sm font-semibold text-ink">
                {tenantContext?.role ?? "--"}
              </p>
            </div>
          </div>
        </article>

        <article className="panel rounded-[2rem] p-6 md:p-8">
          <p className="app-kicker">System checks</p>
          <p className="mt-2 text-sm text-ink/70">
            Verify environment readiness before running production workflows.
          </p>
          <div className="mt-4 overflow-hidden rounded-[1.2rem] border border-ink/12 bg-white/90">
            <div className="grid grid-cols-[1fr_auto] border-b border-ink/10 bg-ink/[0.035] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/55">
              <p>Check</p>
              <p>Status</p>
            </div>
            {checks.map((check) => (
              <div
                key={check.label}
                className="flex items-center justify-between border-b border-ink/8 px-4 py-3 last:border-b-0"
              >
                <p className="text-sm font-medium text-ink">{check.label}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                    check.ok
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  {check.value}
                </span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
