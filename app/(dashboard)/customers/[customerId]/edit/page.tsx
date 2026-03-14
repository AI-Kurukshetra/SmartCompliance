import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UpdateCustomerForm } from "@/components/customers/update-customer-form";
import {
  ArrowRightIcon,
  GlobeIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getCustomerById } from "@/modules/customers/repository";

export const metadata = {
  title: "Edit Customer | SmartCompliance",
};

type EditCustomerPageProps = {
  params: Promise<{
    customerId: string;
  }>;
};

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { customerId } = await params;
  const isSupabaseEnabled = hasSupabaseEnv();

  if (!isSupabaseEnabled) {
    notFound();
  }

  const tenantContext = await getTenantContext();

  if (!tenantContext) {
    notFound();
  }

  const canEditCustomers = canManageTenant(tenantContext.role);
  let customer: Awaited<ReturnType<typeof getCustomerById>>;

  try {
    customer = await getCustomerById(
      {
        supabase: await createClient(),
        tenantId: tenantContext.tenantId,
      },
      customerId,
    );
  } catch {
    notFound();
  }

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex rounded-xl bg-ink p-2 text-shell">
                <UsersIcon />
              </span>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Customer maintenance</p>
            </div>
            <h1 className="mt-3 font-[var(--font-display)] text-4xl leading-tight text-ink md:text-5xl">
              Edit customer profile
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/70">
              Updating <strong>{customer.firstName} {customer.lastName}</strong>. Save changes
              to refresh risk and contact details across verification workflows.
            </p>
          </div>
          <Link
            href="/customers"
            className="rounded-xl border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white"
          >
            Back to customers
          </Link>
        </div>
      </article>

      {!canEditCustomers ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your role can review customer data but cannot edit records.
        </p>
      ) : null}

      <article className="panel rounded-[2rem] p-4 md:p-6">
        <UpdateCustomerForm customer={customer} disabled={!canEditCustomers} />
      </article>

      <aside className="panel-strong rounded-[2rem] p-4 md:p-5">
        <Image
          src="/customer-onboarding-visual.svg"
          alt="Customer profile workflow illustration"
          width={1280}
          height={760}
          className="h-auto w-full rounded-[1.2rem]"
        />
        <div className="mt-4 space-y-3 rounded-[1.2rem] border border-ink/10 bg-white/88 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/54">Update cues</p>
          <p className="flex items-center gap-2 text-sm text-ink/70">
            <UsersIcon className="h-4 w-4 text-ink/55" />
            Ensure spelling matches official identity documents.
          </p>
          <p className="flex items-center gap-2 text-sm text-ink/70">
            <GlobeIcon className="h-4 w-4 text-ink/55" />
            Keep country and contact fields aligned with latest data.
          </p>
          <p className="flex items-center gap-2 text-sm text-ink/70">
            <ShieldCheckIcon className="h-4 w-4 text-ink/55" />
            Raise risk level when new screening evidence is present.
          </p>
          <Link
            href="/cases/new"
            className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-ink transition hover:text-ink/75"
          >
            Create linked case
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </aside>
    </section>
  );
}
