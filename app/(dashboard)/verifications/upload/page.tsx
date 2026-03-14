import Link from "next/link";
import { UploadDocumentForm } from "@/components/verifications/upload-document-form";
import { ListChecksIcon } from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { listVerificationSessions } from "@/modules/verifications/repository";

export const metadata = {
  title: "Upload Verification Document | SmartCompliance",
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default async function UploadVerificationDocumentPage() {
  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;
  const canManage = tenantContext ? canManageTenant(tenantContext.role) : false;

  const sessions =
    isSupabaseEnabled && tenantContext
      ? await listVerificationSessions(
          {
            supabase: await createClient(),
            tenantId: tenantContext.tenantId,
          },
          {},
        )
      : [];

  const sessionOptions = sessions.map((session) => ({
    id: session.id,
    label: `${session.customerName} • ${formatLabel(session.status)}`,
  }));

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-xl bg-ink p-2 text-shell">
            <ListChecksIcon />
          </span>
          <p className="text-xs uppercase tracking-[0.3em] text-ink/55">OCR pipeline</p>
        </div>
        <h1 className="mt-4 font-[var(--font-display)] text-4xl leading-tight text-ink">
          Upload verification document
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink/72">
          Add a placeholder document and run OCR extraction metadata.
        </p>
      </article>

      <article className="panel rounded-[2rem] p-6 md:p-8">
        <UploadDocumentForm
          disabled={!isSupabaseEnabled || !canManage}
          sessions={sessionOptions}
        />
        <div className="mt-6">
          <Link
            href="/verifications"
            className="inline-flex rounded-xl border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white"
          >
            Back to verifications
          </Link>
        </div>
      </article>
    </section>
  );
}
