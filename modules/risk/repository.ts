import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DecisionStatus,
  RiskDecisionResult,
  RiskLevel,
  RiskProfileRecord,
} from "@/modules/risk/types";

type RiskRepositoryParams = {
  supabase: SupabaseClient;
  tenantId: string;
};

type SessionRow = {
  id: string;
  customer_id: string;
};

type DocumentRow = {
  id: string;
  document_confidence: number | null;
  status: "uploaded" | "processing" | "verified" | "rejected";
};

type WatchlistRow = {
  status: "clear" | "possible_match" | "confirmed_match" | "manual_review";
  match_score: number | null;
};

type RuleRow = {
  id: string;
  name: string;
  score: number;
  decision_action: DecisionStatus | null;
  condition: Record<string, unknown> | null;
};

type RiskProfileRow = {
  id: string;
  verification_session_id: string | null;
  customer_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  factors: Record<string, unknown> | null;
  created_at: string;
};

function clampRiskScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toRiskLevel(score: number): RiskLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

function decideFromScore(score: number): DecisionStatus {
  if (score >= 75) return "rejected";
  if (score >= 45) return "manual_review";
  return "approved";
}

function toVerificationStatus(decision: DecisionStatus) {
  switch (decision) {
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    default:
      return "review";
  }
}

function decisionRank(value: DecisionStatus) {
  if (value === "rejected") return 3;
  if (value === "manual_review") return 2;
  return 1;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function mapRiskProfile(row: RiskProfileRow): RiskProfileRecord {
  return {
    id: row.id,
    verificationSessionId: row.verification_session_id,
    customerId: row.customer_id,
    riskScore: row.risk_score,
    riskLevel: row.risk_level,
    factors: row.factors ?? {},
    createdAt: row.created_at,
  };
}

export async function runRiskDecisionEngine(
  { supabase, tenantId }: RiskRepositoryParams,
  input: { verificationSessionId: string },
): Promise<RiskDecisionResult> {
  const { data: session, error: sessionError } = await supabase
    .from("verification_sessions")
    .select("id, customer_id")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .eq("id", input.verificationSessionId)
    .maybeSingle();

  if (sessionError || !session) {
    throw new Error("Verification session was not found for risk evaluation.");
  }

  const verificationSession = session as SessionRow;

  const [documentsResult, watchlistResult, rulesResult] = await Promise.all([
    supabase
      .from("documents")
      .select("id, document_confidence, status")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .eq("verification_session_id", verificationSession.id),
    supabase
      .from("watchlist_results")
      .select("status, match_score")
      .eq("tenant_id", tenantId)
      .eq("verification_session_id", verificationSession.id),
    supabase
      .from("rules")
      .select("id, name, score, decision_action, condition")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .eq("enabled", true),
  ]);

  if (documentsResult.error) {
    throw new Error("Unable to load documents for risk evaluation.");
  }

  if (watchlistResult.error) {
    throw new Error("Unable to load watchlist results for risk evaluation.");
  }

  if (rulesResult.error) {
    throw new Error("Unable to load rules for risk evaluation.");
  }

  const documents = (documentsResult.data ?? []) as DocumentRow[];
  const watchlistEntries = (watchlistResult.data ?? []) as WatchlistRow[];
  const rules = (rulesResult.data ?? []) as RuleRow[];

  let score = 0;
  const factorLog: string[] = [];
  const appliedRules: Array<{
    id: string;
    name: string;
    score: number;
    decision: DecisionStatus | null;
  }> = [];

  if (documents.length === 0) {
    score += 30;
    factorLog.push("No verification documents available.");
  }

  const verifiedDocuments = documents.filter((doc) => doc.status === "verified");
  const bestDocumentConfidence = verifiedDocuments.reduce((best, document) => {
    const confidence = document.document_confidence ?? 0;
    return Math.max(best, confidence);
  }, 0);

  if (verifiedDocuments.length > 0 && bestDocumentConfidence < 80) {
    score += 15;
    factorLog.push("Best document confidence is below 80.");
  }

  if (verifiedDocuments.length > 0 && bestDocumentConfidence < 65) {
    score += 20;
    factorLog.push("Best document confidence is below 65.");
  }

  const hasConfirmedMatch = watchlistEntries.some(
    (entry) => entry.status === "confirmed_match",
  );
  const hasPossibleMatch = watchlistEntries.some(
    (entry) => entry.status === "possible_match",
  );
  const hasManualReview = watchlistEntries.some(
    (entry) => entry.status === "manual_review",
  );

  if (hasConfirmedMatch) {
    score += 70;
    factorLog.push("Confirmed watchlist match detected.");
  } else if (hasPossibleMatch) {
    score += 40;
    factorLog.push("Possible watchlist match detected.");
  } else if (hasManualReview) {
    score += 25;
    factorLog.push("Watchlist provider flagged manual review.");
  }

  let ruleDrivenDecision: DecisionStatus | null = null;

  for (const rule of rules) {
    const condition = (rule.condition ?? {}) as Record<string, unknown>;
    const requiredStatuses = asStringArray(condition.watchlist_status_in);
    const missingDocuments = condition.missing_documents === true;
    const minDocumentConfidence =
      typeof condition.min_document_confidence === "number"
        ? condition.min_document_confidence
        : null;

    if (requiredStatuses.length > 0) {
      const matched = watchlistEntries.some((entry) =>
        requiredStatuses.includes(entry.status),
      );

      if (!matched) {
        continue;
      }
    }

    if (missingDocuments && documents.length > 0) {
      continue;
    }

    if (
      typeof minDocumentConfidence === "number" &&
      bestDocumentConfidence < minDocumentConfidence
    ) {
      continue;
    }

    score += rule.score;
    appliedRules.push({
      id: rule.id,
      name: rule.name,
      score: rule.score,
      decision: rule.decision_action,
    });
    factorLog.push(`Rule applied: ${rule.name} (+${rule.score}).`);

    if (rule.decision_action) {
      if (
        !ruleDrivenDecision ||
        decisionRank(rule.decision_action) > decisionRank(ruleDrivenDecision)
      ) {
        ruleDrivenDecision = rule.decision_action;
      }
    }
  }

  const riskScore = clampRiskScore(score);
  const riskLevel = toRiskLevel(riskScore);
  const decision = ruleDrivenDecision ?? decideFromScore(riskScore);
  const verificationStatus = toVerificationStatus(decision);

  const factors = {
    generated_at: new Date().toISOString(),
    applied_factors: factorLog,
    watchlist_summary: {
      count: watchlistEntries.length,
      has_confirmed_match: hasConfirmedMatch,
      has_possible_match: hasPossibleMatch,
      has_manual_review: hasManualReview,
    },
    document_summary: {
      count: documents.length,
      verified_count: verifiedDocuments.length,
      best_confidence: bestDocumentConfidence,
    },
    applied_rules: appliedRules,
  } satisfies Record<string, unknown>;

  const completionTimestamp =
    decision === "manual_review" ? null : new Date().toISOString();

  const [{ error: updateSessionError }, { error: insertRiskProfileError }] =
    await Promise.all([
      supabase
        .from("verification_sessions")
        .update({
          risk_score: riskScore,
          decision,
          status: verificationStatus,
          completed_at: completionTimestamp,
        })
        .eq("tenant_id", tenantId)
        .eq("id", verificationSession.id),
      supabase.from("risk_profiles").insert({
        tenant_id: tenantId,
        customer_id: verificationSession.customer_id,
        verification_session_id: verificationSession.id,
        risk_score: riskScore,
        risk_level: riskLevel,
        factors,
      }),
    ]);

  if (updateSessionError) {
    throw new Error("Unable to update verification decision.");
  }

  if (insertRiskProfileError) {
    throw new Error("Unable to store risk profile output.");
  }

  return {
    verificationSessionId: verificationSession.id,
    customerId: verificationSession.customer_id,
    riskScore,
    riskLevel,
    decision,
    verificationStatus,
    factors,
  };
}

export async function listRiskProfiles(
  { supabase, tenantId }: RiskRepositoryParams,
  filters: { verificationSessionId?: string },
) {
  let query = supabase
    .from("risk_profiles")
    .select(
      "id, verification_session_id, customer_id, risk_score, risk_level, factors, created_at",
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(60);

  if (filters.verificationSessionId) {
    query = query.eq("verification_session_id", filters.verificationSessionId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load risk profiles.");
  }

  return ((data ?? []) as RiskProfileRow[]).map((row) => mapRiskProfile(row));
}
