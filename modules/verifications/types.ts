export const VERIFICATION_STATUSES = [
  "pending",
  "collecting_documents",
  "screening",
  "review",
  "approved",
  "rejected",
] as const;

export const DOCUMENT_STATUSES = [
  "uploaded",
  "processing",
  "verified",
  "rejected",
] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export type VerificationRecord = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string | null;
  status: VerificationStatus;
  decision: "approved" | "rejected" | "manual_review";
  riskScore: number;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
};

export type VerificationDocumentRecord = {
  id: string;
  verificationSessionId: string;
  customerId: string;
  documentType: string;
  storagePath: string;
  mimeType: string | null;
  status: DocumentStatus;
  documentConfidence: number | null;
  ocrData: Record<string, unknown>;
  createdAt: string;
};

export type VerificationFilters = {
  query?: string;
  status?: VerificationStatus;
};

export type VerificationDocumentFilters = {
  verificationSessionId?: string;
};

export type CreateVerificationSessionInput = {
  customerId: string;
};

export type UploadDocumentPlaceholderInput = {
  verificationSessionId: string;
  documentType: string;
  fileName?: string;
  mimeType?: string;
};
