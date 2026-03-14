"use client";

import { useActionState } from "react";
import { uploadDocumentPlaceholderAction } from "@/app/actions/verifications";
import { AuthSubmitButton } from "@/components/auth/submit-button";
import {
  INITIAL_VERIFICATION_FORM_STATE,
} from "@/components/verifications/form-state";

type UploadDocumentFormProps = {
  disabled?: boolean;
  sessions: Array<{
    id: string;
    label: string;
  }>;
};

const inputClassName =
  "w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 text-sm text-ink shadow-[0_1px_0_rgba(9,24,43,0.03)] outline-none transition placeholder:text-ink/35 focus:border-ink/40 focus:ring-2 focus:ring-ink/10";

export function UploadDocumentForm({
  disabled = false,
  sessions,
}: UploadDocumentFormProps) {
  const [state, formAction] = useActionState(
    uploadDocumentPlaceholderAction,
    INITIAL_VERIFICATION_FORM_STATE,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-ink">
        <span>Verification session</span>
        <select
          name="verificationSessionId"
          defaultValue={state.values.verificationSessionId ?? ""}
          disabled={disabled}
          className={inputClassName}
          required
        >
          <option value="">Select session</option>
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-ink">
          <span>Document type</span>
          <select
            name="documentType"
            defaultValue={state.values.documentType ?? "passport"}
            disabled={disabled}
            className={inputClassName}
            required
          >
            <option value="passport">Passport</option>
            <option value="national_id">National ID</option>
            <option value="drivers_license">Driver&apos;s license</option>
            <option value="residence_permit">Residence permit</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-ink">
          <span>MIME type</span>
          <input
            name="mimeType"
            defaultValue={state.values.mimeType ?? ""}
            disabled={disabled}
            className={inputClassName}
            placeholder="image/jpeg"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium text-ink">
        <span>File name</span>
        <input
          name="fileName"
          defaultValue={state.values.fileName ?? ""}
          disabled={disabled}
          className={inputClassName}
          placeholder="passport-front.jpg"
        />
      </label>
      {state.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}
      <AuthSubmitButton
        disabled={disabled || sessions.length === 0}
        idleLabel="Upload placeholder doc"
        pendingLabel="Processing OCR..."
      />
    </form>
  );
}
