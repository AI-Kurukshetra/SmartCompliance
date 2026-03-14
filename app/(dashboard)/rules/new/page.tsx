import Link from "next/link";
import { CreateRuleForm } from "@/components/rules/create-rule-form";
import { ActivityIcon } from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";

export const metadata = {
  title: "Create Rule | SmartCompliance",
};

export default async function NewRulePage() {
  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;
  const canManage = tenantContext ? canManageTenant(tenantContext.role) : false;

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-xl bg-ink p-2 text-shell">
            <ActivityIcon />
          </span>
          <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Rule builder</p>
        </div>
        <h1 className="mt-4 font-[var(--font-display)] text-4xl leading-tight text-ink">
          Create risk rule
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink/72">
          Configure score impact, decision behavior, and rule conditions.
        </p>
      </article>

      <article className="panel rounded-[2rem] p-6 md:p-8">
        <CreateRuleForm disabled={!isSupabaseEnabled || !canManage} />
        <div className="mt-6">
          <Link
            href="/rules"
            className="inline-flex rounded-xl border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white"
          >
            Back to rules
          </Link>
        </div>
      </article>
    </section>
  );
}
