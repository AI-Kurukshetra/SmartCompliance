import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnalyticsOverview } from "@/modules/analytics/types";

type AnalyticsRepositoryParams = {
  supabase: SupabaseClient;
  tenantId: string;
};

type RiskProfileRow = {
  risk_score: number;
  risk_level: "low" | "medium" | "high" | "critical";
};

type VerificationStatusRow = {
  status:
    | "pending"
    | "collecting_documents"
    | "screening"
    | "review"
    | "approved"
    | "rejected";
};

type CaseStatusRow = {
  status: "open" | "in_review" | "resolved" | "closed";
};

export async function getAnalyticsOverview({
  supabase,
  tenantId,
}: AnalyticsRepositoryParams): Promise<AnalyticsOverview> {
  const [
    riskProfilesResult,
    verificationStatusResult,
    caseStatusResult,
    openAlertsResult,
    criticalAlertsResult,
    flaggedTransactionsResult,
  ] = await Promise.all([
    supabase
      .from("risk_profiles")
      .select("risk_score, risk_level")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(400),
    supabase
      .from("verification_sessions")
      .select("status")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(400),
    supabase
      .from("cases")
      .select("status")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(400),
    supabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .in("status", ["open", "acknowledged"]),
    supabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .eq("severity", "critical"),
    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .eq("status", "flagged"),
  ]);

  if (
    riskProfilesResult.error ||
    verificationStatusResult.error ||
    caseStatusResult.error ||
    openAlertsResult.error ||
    criticalAlertsResult.error ||
    flaggedTransactionsResult.error
  ) {
    throw new Error("Unable to load analytics overview.");
  }

  const riskProfiles = (riskProfilesResult.data ?? []) as RiskProfileRow[];
  const verificationStatuses =
    (verificationStatusResult.data ?? []) as VerificationStatusRow[];
  const caseStatuses = (caseStatusResult.data ?? []) as CaseStatusRow[];

  const avgRiskScore =
    riskProfiles.length > 0
      ? Math.round(
          riskProfiles.reduce((sum, item) => sum + Number(item.risk_score), 0) /
            riskProfiles.length,
        )
      : 0;

  return {
    generatedAt: new Date().toISOString(),
    risk: {
      avgRiskScore,
      criticalProfiles: riskProfiles.filter((item) => item.risk_level === "critical")
        .length,
      highProfiles: riskProfiles.filter((item) => item.risk_level === "high").length,
    },
    fraud: {
      openAlerts: openAlertsResult.count ?? 0,
      criticalAlerts: criticalAlertsResult.count ?? 0,
      flaggedTransactions: flaggedTransactionsResult.count ?? 0,
    },
    verification: {
      total: verificationStatuses.length,
      approved: verificationStatuses.filter((item) => item.status === "approved").length,
      rejected: verificationStatuses.filter((item) => item.status === "rejected").length,
      review: verificationStatuses.filter((item) => item.status === "review").length,
    },
    cases: {
      total: caseStatuses.length,
      open: caseStatuses.filter((item) => item.status === "open").length,
      inReview: caseStatuses.filter((item) => item.status === "in_review").length,
      resolved: caseStatuses.filter((item) => item.status === "resolved").length,
      closed: caseStatuses.filter((item) => item.status === "closed").length,
    },
  };
}
