import { UploadDocumentForm } from "@/components/verifications/upload-document-form";
import { WorkflowShell } from "@/components/dashboard/workflow-shell";
import {
  ActivityIcon,
  ListChecksIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";
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
  const notices = [];

  if (!isSupabaseEnabled) {
    notices.push({
      tone: "info" as const,
      message:
        "Supabase environment variables are missing, so document upload is disabled.",
    });
  }

  if (isSupabaseEnabled && tenantContext && !canManage) {
    notices.push({
      tone: "warning" as const,
      message: "Your role can review verification data but cannot upload documents.",
    });
  }

  if (isSupabaseEnabled && canManage && sessionOptions.length === 0) {
    notices.push({
      tone: "info" as const,
      message: "No verification sessions are available. Start a session before uploading a document.",
    });
  }

  return (
    <WorkflowShell
      backHref="/verifications"
      backLabel="Back to verifications"
      eyebrow="OCR pipeline"
      title="Upload verification document"
      description="Attach a placeholder document to an existing session so OCR metadata and confidence signals can enter the workflow."
      icon={ListChecksIcon}
      formTitle="Document intake"
      formDescription="Choose the right verification session, then provide the placeholder file details used to simulate evidence ingestion."
      facts={[
        {
          label: "Sessions",
          value: `${sessionOptions.length}`,
          detail: sessionOptions.length > 0 ? "Ready for evidence intake" : "Create a session first",
        },
        {
          label: "Access",
          value: canManage ? "Upload" : "Review",
          detail: canManage ? "Evidence intake enabled" : "Execution disabled",
        },
        {
          label: "Output",
          value: "OCR",
          detail: "Confidence and extraction metadata",
        },
      ]}
      notices={notices}
      railEyebrow="Document intake"
      railTitle="Operator notes"
      railDescription="Evidence quality at upload drives confidence scoring and downstream decision context."
      steps={[
        {
          title: "Bind to the correct session",
          detail: "Keep every upload attached to the active verification record for that customer.",
          icon: ListChecksIcon,
        },
        {
          title: "Capture document identity",
          detail: "Use clear MIME type and file naming so audit output remains understandable.",
          icon: ShieldCheckIcon,
        },
        {
          title: "Feed the OCR lane",
          detail: "Uploaded document metadata becomes part of the screening and risk narrative.",
          icon: ActivityIcon,
        },
      ]}
      railLink={{ href: "/verifications/screening", label: "Run screening next" }}
      visual={{
        src: "/compliance-grid-visual.svg",
        alt: "Verification and OCR workflow illustration",
      }}
    >
      <UploadDocumentForm
        disabled={!isSupabaseEnabled || !canManage}
        sessions={sessionOptions}
      />
    </WorkflowShell>
  );
}
