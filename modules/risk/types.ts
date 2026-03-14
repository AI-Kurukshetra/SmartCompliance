export type RiskLevel = "low" | "medium" | "high" | "critical";
export type DecisionStatus = "approved" | "rejected" | "manual_review";

export type RiskDecisionResult = {
  verificationSessionId: string;
  customerId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  decision: DecisionStatus;
  verificationStatus: "approved" | "rejected" | "review";
  factors: Record<string, unknown>;
};

export type RiskProfileRecord = {
  id: string;
  verificationSessionId: string | null;
  customerId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  factors: Record<string, unknown>;
  createdAt: string;
};
