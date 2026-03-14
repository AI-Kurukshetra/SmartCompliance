export const CUSTOMER_RISK_LEVELS = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type CustomerRiskLevel = (typeof CUSTOMER_RISK_LEVELS)[number];

export type CustomerRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  countryCode: string | null;
  riskLevel: CustomerRiskLevel;
  createdAt: string;
};

export type CustomerFilters = {
  query?: string;
  risk?: CustomerRiskLevel;
};

export type CreateCustomerInput = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  countryCode?: string;
  riskLevel: CustomerRiskLevel;
};

export type UpdateCustomerInput = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  countryCode?: string;
  riskLevel: CustomerRiskLevel;
};
