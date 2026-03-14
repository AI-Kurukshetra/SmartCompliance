export type AnalyticsOverview = {
  generatedAt: string;
  risk: {
    avgRiskScore: number;
    criticalProfiles: number;
    highProfiles: number;
  };
  fraud: {
    openAlerts: number;
    criticalAlerts: number;
    flaggedTransactions: number;
  };
  verification: {
    total: number;
    approved: number;
    rejected: number;
    review: number;
  };
  cases: {
    total: number;
    open: number;
    inReview: number;
    resolved: number;
    closed: number;
  };
};
