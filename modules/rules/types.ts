import type { ScreeningStatus } from "@/modules/watchlist/types";

export const RULE_DECISION_ACTIONS = [
  "approved",
  "rejected",
  "manual_review",
] as const;

export type RuleDecisionAction = (typeof RULE_DECISION_ACTIONS)[number];

export type RuleCondition = {
  watchlistStatusIn?: ScreeningStatus[];
  missingDocuments?: boolean;
  minDocumentConfidence?: number;
  maxDocumentConfidence?: number;
};

export type RuleRecord = {
  id: string;
  name: string;
  description: string | null;
  score: number;
  decisionAction: RuleDecisionAction | null;
  enabled: boolean;
  version: number;
  condition: RuleCondition;
  createdAt: string;
  updatedAt: string;
};

export type RuleFilters = {
  query?: string;
  enabled?: boolean;
};

export type CreateRuleInput = {
  name: string;
  description?: string;
  score: number;
  decisionAction?: RuleDecisionAction;
  enabled: boolean;
  condition: RuleCondition;
};

export type UpdateRuleInput = Partial<CreateRuleInput>;
