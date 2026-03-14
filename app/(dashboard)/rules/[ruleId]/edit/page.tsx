import Link from "next/link";
import { notFound } from "next/navigation";
import { UpdateRuleForm } from "@/components/rules/update-rule-form";
import { ActivityIcon } from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getRuleById } from "@/modules/rules/repository";

export const metadata = {
  title: "Edit Rule | SmartCompliance",
};

type EditRulePageProps = {
  params: Promise<{
    ruleId: string;
  }>;
};

export default async function EditRulePage({ params }: EditRulePageProps) {
  const { ruleId } = await params;
  const isSupabaseEnabled = hasSupabaseEnv();

  if (!isSupabaseEnabled) {
    notFound();
  }

  const tenantContext = await getTenantContext();

  if (!tenantContext) {
    notFound();
  }

  const canManage = canManageTenant(tenantContext.role);
  let rule: Awaited<ReturnType<typeof getRuleById>>;

  try {
    rule = await getRuleById(
      {
        supabase: await createClient(),
        tenantId: tenantContext.tenantId,
      },
      ruleId,
    );
  } catch {
    notFound();
  }

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
          Edit risk rule
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink/72">
          Updating <strong>{rule.name}</strong> (v{rule.version}).
        </p>
      </article>

      <article className="panel rounded-[2rem] p-6 md:p-8">
        <UpdateRuleForm rule={rule} disabled={!canManage} />
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
