import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/modules/audit/repository";
import type {
  CreateRuleInput,
  RuleCondition,
  RuleDecisionAction,
  RuleFilters,
  RuleRecord,
  UpdateRuleInput,
} from "@/modules/rules/types";
import { SCREENING_STATUSES } from "@/modules/watchlist/types";

type RulesRepositoryParams = {
  supabase: SupabaseClient;
  tenantId: string;
  actorUserId?: string | null;
};

type RuleRow = {
  id: string;
  name: string;
  description: string | null;
  score: number;
  decision_action: RuleDecisionAction | null;
  enabled: boolean;
  version: number;
  condition: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

const screeningStatusSet = new Set<string>(SCREENING_STATUSES);

function toCondition(condition: Record<string, unknown> | null): RuleCondition {
  const source = condition ?? {};
  const watchlistStatusIn = Array.isArray(source.watchlist_status_in)
    ? source.watchlist_status_in.filter(
        (value): value is (typeof SCREENING_STATUSES)[number] =>
          typeof value === "string" && screeningStatusSet.has(value),
      )
    : undefined;

  return {
    watchlistStatusIn:
      watchlistStatusIn && watchlistStatusIn.length > 0
        ? watchlistStatusIn
        : undefined,
    missingDocuments:
      typeof source.missing_documents === "boolean"
        ? source.missing_documents
        : undefined,
    minDocumentConfidence:
      typeof source.min_document_confidence === "number"
        ? source.min_document_confidence
        : undefined,
    maxDocumentConfidence:
      typeof source.max_document_confidence === "number"
        ? source.max_document_confidence
        : undefined,
  };
}

function toConditionPayload(condition: RuleCondition) {
  const payload: Record<string, unknown> = {};

  if (condition.watchlistStatusIn && condition.watchlistStatusIn.length > 0) {
    payload.watchlist_status_in = condition.watchlistStatusIn;
  }

  if (typeof condition.missingDocuments === "boolean") {
    payload.missing_documents = condition.missingDocuments;
  }

  if (typeof condition.minDocumentConfidence === "number") {
    payload.min_document_confidence = condition.minDocumentConfidence;
  }

  if (typeof condition.maxDocumentConfidence === "number") {
    payload.max_document_confidence = condition.maxDocumentConfidence;
  }

  return payload;
}

function mapRule(row: RuleRow): RuleRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    score: row.score,
    decisionAction: row.decision_action,
    enabled: row.enabled,
    version: row.version,
    condition: toCondition(row.condition),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listRules(
  { supabase, tenantId }: Omit<RulesRepositoryParams, "actorUserId">,
  filters: RuleFilters,
) {
  let query = supabase
    .from("rules")
    .select(
      "id, name, description, score, decision_action, enabled, version, condition, created_at, updated_at",
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (filters.enabled !== undefined) {
    query = query.eq("enabled", filters.enabled);
  }

  if (filters.query) {
    const escapedQuery = filters.query.replaceAll(",", " ").trim();
    query = query.or(
      `name.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load rules.");
  }

  return ((data ?? []) as RuleRow[]).map((row) => mapRule(row));
}

export async function getRuleById(
  { supabase, tenantId }: Omit<RulesRepositoryParams, "actorUserId">,
  ruleId: string,
) {
  const { data, error } = await supabase
    .from("rules")
    .select(
      "id, name, description, score, decision_action, enabled, version, condition, created_at, updated_at",
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .eq("id", ruleId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Rule was not found.");
  }

  return mapRule(data as RuleRow);
}

export async function createRule(
  { supabase, tenantId, actorUserId }: RulesRepositoryParams,
  input: CreateRuleInput,
) {
  const { data, error } = await supabase
    .from("rules")
    .insert({
      tenant_id: tenantId,
      name: input.name,
      description: input.description ?? null,
      score: input.score,
      decision_action: input.decisionAction ?? null,
      enabled: input.enabled,
      condition: toConditionPayload(input.condition),
      version: 1,
    })
    .select(
      "id, name, description, score, decision_action, enabled, version, condition, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error("Unable to create rule.");
  }

  const createdRule = mapRule(data as RuleRow);

  await writeAuditLog(supabase, {
    tenantId,
    actorUserId,
    entityType: "rule",
    entityId: createdRule.id,
    action: "rule.created",
    metadata: {
      score: createdRule.score,
      decisionAction: createdRule.decisionAction,
      enabled: createdRule.enabled,
      condition: createdRule.condition,
    },
  });

  return createdRule;
}

export async function updateRule(
  { supabase, tenantId, actorUserId }: RulesRepositoryParams,
  ruleId: string,
  input: UpdateRuleInput,
) {
  const { data: existingRule, error: existingRuleError } = await supabase
    .from("rules")
    .select("id, version")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .eq("id", ruleId)
    .maybeSingle();

  if (existingRuleError || !existingRule) {
    throw new Error("Rule was not found.");
  }

  const payload: Record<string, unknown> = {
    version: ((existingRule as { version: number }).version ?? 1) + 1,
  };

  if (input.name !== undefined) {
    payload.name = input.name;
  }

  if (input.description !== undefined) {
    payload.description = input.description ?? null;
  }

  if (input.score !== undefined) {
    payload.score = input.score;
  }

  if (input.decisionAction !== undefined) {
    payload.decision_action = input.decisionAction ?? null;
  }

  if (input.enabled !== undefined) {
    payload.enabled = input.enabled;
  }

  if (input.condition !== undefined) {
    payload.condition = toConditionPayload(input.condition);
  }

  const { error: updateError } = await supabase
    .from("rules")
    .update(payload)
    .eq("tenant_id", tenantId)
    .eq("id", ruleId);

  if (updateError) {
    throw new Error("Unable to update rule.");
  }

  const updatedRule = await getRuleById({ supabase, tenantId }, ruleId);

  await writeAuditLog(supabase, {
    tenantId,
    actorUserId,
    entityType: "rule",
    entityId: ruleId,
    action: "rule.updated",
    metadata: {
      score: updatedRule.score,
      decisionAction: updatedRule.decisionAction,
      enabled: updatedRule.enabled,
      condition: updatedRule.condition,
      version: updatedRule.version,
    },
  });

  return updatedRule;
}
