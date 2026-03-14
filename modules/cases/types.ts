export const CASE_STATUSES = ["open", "in_review", "resolved", "closed"] as const;
export const CASE_PRIORITIES = ["low", "medium", "high", "critical"] as const;
export const CASE_DECISIONS = [
  "approved",
  "rejected",
  "manual_review",
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];
export type CasePriority = (typeof CASE_PRIORITIES)[number];
export type CaseDecision = (typeof CASE_DECISIONS)[number];

export type ComplianceOfficerRecord = {
  id: string;
  fullName: string | null;
  email: string;
  role: "admin" | "compliance_officer" | "developer";
};

export type CaseRecord = {
  id: string;
  verificationSessionId: string | null;
  customerId: string | null;
  customerName: string;
  customerEmail: string | null;
  assignedTo: string | null;
  assignedOfficerName: string | null;
  assignedOfficerEmail: string | null;
  status: CaseStatus;
  resolutionDecision: CaseDecision | null;
  priority: CasePriority;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
};

export type CaseFilters = {
  query?: string;
  status?: CaseStatus;
  priority?: CasePriority;
  assignedTo?: string;
};

export type CreateCaseInput = {
  verificationSessionId?: string;
  assignedTo?: string;
  priority: CasePriority;
  notes?: string;
};

export type UpdateCaseInput = {
  status?: CaseStatus;
  resolutionDecision?: CaseDecision;
  assignedTo?: string | null;
  notes?: string;
};
