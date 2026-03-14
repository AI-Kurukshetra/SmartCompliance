import Link from "next/link";
import { CreateCaseForm } from "@/components/cases/create-case-form";
import { ListChecksIcon } from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  listComplianceOfficers,
} from "@/modules/cases/repository";
import { listVerificationSessions } from "@/modules/verifications/repository";

export const metadata = {
  title: "Create Case | SmartCompliance",
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default async function NewCasePage() {
  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;
  const canManage = tenantContext ? canManageTenant(tenantContext.role) : false;

  let sessions: Awaited<ReturnType<typeof listVerificationSessions>> = [];
  let officers: Awaited<ReturnType<typeof listComplianceOfficers>> = [];

  if (isSupabaseEnabled && tenantContext) {
    const supabase = await createClient();
    [sessions, officers] = await Promise.all([
      listVerificationSessions(
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

  const sessionOptions = sessions.map((item) => ({
    id: item.id,
    label: `${item.customerName} • ${formatLabel(item.status)} • ${item.id.slice(0, 8)}`,
  }));
  const officerOptions = officers.map((item) => ({
    id: item.id,
    label: `${item.fullName ?? item.email} (${item.email})`,
  }));

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-xl bg-ink p-2 text-shell">
            <ListChecksIcon />
          </span>
          <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Case creation</p>
        </div>
        <h1 className="mt-4 font-[var(--font-display)] text-4xl leading-tight text-ink">
          Create a case
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink/72">
          Open a case from verification context and assign to a compliance officer.
        </p>
      </article>

      <article className="panel rounded-[2rem] p-6 md:p-8">
        <CreateCaseForm
          disabled={!isSupabaseEnabled || !canManage}
          verificationSessions={sessionOptions}
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
