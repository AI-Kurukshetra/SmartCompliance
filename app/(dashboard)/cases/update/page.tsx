import Link from "next/link";
import { UpdateCaseForm } from "@/components/cases/update-case-form";
import { ActivityIcon } from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  listCases,
  listComplianceOfficers,
} from "@/modules/cases/repository";

export const metadata = {
  title: "Update Case | SmartCompliance",
};

export default async function UpdateCasePage() {
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
        {},
      ),
      listComplianceOfficers({
        supabase,
        tenantId: tenantContext.tenantId,
      }),
    ]);
  }

  const officerOptions = officers.map((item) => ({
    id: item.id,
    label: `${item.fullName ?? item.email} (${item.email})`,
  }));
  const caseOptions = cases.map((item) => ({
    id: item.id,
    customerName: item.customerName,
    status: item.status,
    priority: item.priority,
  }));

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-xl bg-ink p-2 text-shell">
            <ActivityIcon />
          </span>
          <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Case workflow</p>
        </div>
        <h1 className="mt-4 font-[var(--font-display)] text-4xl leading-tight text-ink">
          Update case status
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink/72">
          Assign officers, set review status, and capture resolution decisions.
        </p>
      </article>

      <article className="panel rounded-[2rem] p-6 md:p-8">
        <UpdateCaseForm
          disabled={!isSupabaseEnabled || !canManage}
          cases={caseOptions}
          officers={officerOptions}
        />
        <div className="mt-6">
          <Link
            href="/cases"
            className="inline-flex rounded-xl border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white"
          >
            Back to cases
          </Link>
        </div>
      </article>
    </section>
  );
}
