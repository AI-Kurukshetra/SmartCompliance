export const TRANSACTION_STATUSES = [
  "pending",
  "cleared",
  "flagged",
  "blocked",
] as const;
export const ALERT_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export const ALERT_STATUSES = ["open", "acknowledged", "resolved"] as const;

export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];
export type AlertStatus = (typeof ALERT_STATUSES)[number];

export type TransactionRecord = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string | null;
  amount: number;
  currency: string;
  transactionType: string;
  status: TransactionStatus;
  counterpartyCountry: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type AlertRecord = {
  id: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string | null;
  transactionId: string | null;
  verificationSessionId: string | null;
  alertType: string;
  severity: AlertSeverity;
  status: AlertStatus;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type TransactionFilters = {
  status?: TransactionStatus;
  customerId?: string;
  query?: string;
};

export type AlertFilters = {
  status?: AlertStatus;
  severity?: AlertSeverity;
  customerId?: string;
};

export type IngestTransactionInput = {
  customerId: string;
  amount: number;
  currency: string;
  transactionType: string;
  counterpartyCountry?: string;
  metadata?: Record<string, unknown>;
};
