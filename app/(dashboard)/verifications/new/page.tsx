import Image from "next/image";
import Link from "next/link";
import { CreateSessionForm } from "@/components/verifications/create-session-form";
import { UsersIcon } from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { listCustomers } from "@/modules/customers/repository";

export const metadata = {
  title: "New Verification Session | SmartCompliance",
};

export default async function NewVerificationSessionPage() {
  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;
  const canManage = tenantContext ? canManageTenant(tenantContext.role) : false;

  const customers =
    isSupabaseEnabled && tenantContext
      ? await listCustomers(
          {
            supabase: await createClient(),
            tenantId: tenantContext.tenantId,
          },
          {},
        )
      : [];

  const customerOptions = customers.map((customer) => ({
    id: customer.id,
    label: `${customer.firstName} ${customer.lastName} (${customer.email ?? "no email"})`,
  }));

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.08fr_0.92fr]">
      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-xl bg-ink p-2 text-shell">
            <UsersIcon />
          </span>
          <p className="text-xs uppercase tracking-[0.3em] text-ink/55">
            Verification setup
          </p>
        </div>
        <h1 className="mt-4 font-[var(--font-display)] text-4xl leading-tight text-ink">
          Start verification session
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink/72">
          Select a customer to initialize a new verification workflow.
        </p>
        <div className="mt-6">
          <CreateSessionForm
            disabled={!isSupabaseEnabled || !canManage}
            customers={customerOptions}
          />
        </div>
        <div className="mt-6">
          <Link
            href="/verifications"
            className="inline-flex rounded-xl border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white"
          >
            Back to verifications
          </Link>
        </div>
      </article>

      <aside className="panel-strong rounded-[2rem] p-4 md:p-5">
        <Image
          src="/compliance-grid-visual.svg"
          alt="Compliance workflow illustration"
          width={1280}
          height={720}
          className="h-auto w-full rounded-[1.2rem] border border-ink/10"
        />
      </aside>
    </section>
  );
}
