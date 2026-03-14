import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/modules/audit/repository";
import type {
  AlertFilters,
  AlertRecord,
  AlertSeverity,
  AlertStatus,
  IngestTransactionInput,
  TransactionFilters,
  TransactionRecord,
} from "@/modules/transactions/types";

type TransactionRepositoryParams = {
  supabase: SupabaseClient;
  tenantId: string;
  actorUserId?: string | null;
};

type CustomerRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  risk_level: "low" | "medium" | "high" | "critical";
};

type TransactionRow = {
  id: string;
  customer_id: string;
  amount: number;
  currency: string;
  transaction_type: string;
  status: "pending" | "cleared" | "flagged" | "blocked";
  counterparty_country: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type AlertRow = {
  id: string;
  customer_id: string | null;
  transaction_id: string | null;
  verification_session_id: string | null;
  alert_type: string;
  severity: AlertSeverity;
  status: AlertStatus;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type AlertDraft = {
  alertType: string;
  severity: AlertSeverity;
  description: string;
  metadata: Record<string, unknown>;
};

const HIGH_RISK_COUNTRIES = new Set(["IR", "KP", "SY", "AF", "MM", "RU"]);

function fullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function mapTransaction(
  row: TransactionRow,
  customer: CustomerRow | undefined,
): TransactionRecord {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: customer ? fullName(customer.first_name, customer.last_name) : "Unknown customer",
    customerEmail: customer?.email ?? null,
    amount: Number(row.amount),
    currency: row.currency,
    transactionType: row.transaction_type,
    status: row.status,
    counterpartyCountry: row.counterparty_country,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

function mapAlert(row: AlertRow, customer: CustomerRow | undefined): AlertRecord {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: customer ? fullName(customer.first_name, customer.last_name) : "System / unknown",
    customerEmail: customer?.email ?? null,
    transactionId: row.transaction_id,
    verificationSessionId: row.verification_session_id,
    alertType: row.alert_type,
    severity: row.severity,
    status: row.status,
    description: row.description,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

function buildAlerts(
  input: IngestTransactionInput,
  customerRisk: CustomerRow["risk_level"],
  recentTransactions: TransactionRow[],
): AlertDraft[] {
  const alerts: AlertDraft[] = [];

  if (input.amount >= 10_000) {
    alerts.push({
      alertType: "high_value_transaction",
      severity: input.amount >= 25_000 ? "critical" : "high",
      description: `Transaction amount ${input.amount.toFixed(2)} exceeds configured threshold.`,
      metadata: {
        threshold: 10_000,
        amount: input.amount,
      },
    });
  }

  if (
    input.counterpartyCountry &&
    HIGH_RISK_COUNTRIES.has(input.counterpartyCountry.toUpperCase())
  ) {
    alerts.push({
      alertType: "high_risk_jurisdiction",
      severity: "high",
      description: `Counterparty country ${input.counterpartyCountry.toUpperCase()} is in the high-risk list.`,
      metadata: {
        counterpartyCountry: input.counterpartyCountry.toUpperCase(),
      },
    });
  }

  const rollingAmount = recentTransactions.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );
  const rollingCount = recentTransactions.length;

  if (rollingCount >= 4 || rollingAmount + input.amount >= 20_000) {
    alerts.push({
      alertType: "rapid_transaction_velocity",
      severity: rollingCount >= 8 ? "high" : "medium",
      description:
        "Customer has elevated transaction velocity in the trailing 24-hour window.",
      metadata: {
        trailing24hCount: rollingCount + 1,
        trailing24hAmount: Number((rollingAmount + input.amount).toFixed(2)),
      },
    });
  }

  if (
    (customerRisk === "high" || customerRisk === "critical") &&
    input.amount >= 3_000
  ) {
    alerts.push({
      alertType: "risk_profile_threshold_breach",
      severity: customerRisk === "critical" ? "critical" : "high",
      description: `High-risk customer initiated a ${input.amount.toFixed(2)} transaction.`,
      metadata: {
        customerRisk,
        amount: input.amount,
      },
    });
  }

  if (input.transactionType.toLowerCase().includes("crypto") && input.amount >= 2_000) {
    alerts.push({
      alertType: "crypto_exposure",
      severity: "medium",
      description: "Crypto transaction volume requires manual compliance review.",
      metadata: {
        amount: input.amount,
      },
    });
  }

  const deduped = new Map<string, AlertDraft>();
  for (const alert of alerts) {
    deduped.set(alert.alertType, alert);
  }

  return Array.from(deduped.values());
}

export async function ingestTransaction(
  { supabase, tenantId, actorUserId }: TransactionRepositoryParams,
  input: IngestTransactionInput,
) {
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, first_name, last_name, email, risk_level")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .eq("id", input.customerId)
    .maybeSingle();

  if (customerError || !customer) {
    throw new Error("Customer was not found for transaction ingestion.");
  }

  const customerRow = customer as CustomerRow;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: recentTransactionsData, error: recentTransactionsError } =
    await supabase
      .from("transactions")
      .select(
        "id, customer_id, amount, currency, transaction_type, status, counterparty_country, metadata, created_at",
      )
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .eq("customer_id", input.customerId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(100);

  if (recentTransactionsError) {
    throw new Error("Unable to evaluate transaction monitoring rules.");
  }

  const recentTransactions = (recentTransactionsData ?? []) as TransactionRow[];
  const generatedAlerts = buildAlerts(input, customerRow.risk_level, recentTransactions);
  const nextStatus = generatedAlerts.length > 0 ? "flagged" : "cleared";

  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .insert({
      tenant_id: tenantId,
      customer_id: input.customerId,
      amount: input.amount,
      currency: input.currency.toUpperCase(),
      transaction_type: input.transactionType,
      status: nextStatus,
      counterparty_country: input.counterpartyCountry ?? null,
      metadata: {
        ...(input.metadata ?? {}),
        monitoring: {
          generatedAlertCount: generatedAlerts.length,
          evaluatedAt: new Date().toISOString(),
        },
      },
    })
    .select(
      "id, customer_id, amount, currency, transaction_type, status, counterparty_country, metadata, created_at",
    )
    .single();

  if (transactionError || !transaction) {
    throw new Error("Unable to ingest transaction.");
  }

  const transactionRow = transaction as TransactionRow;
  let insertedAlerts: AlertRow[] = [];

  if (generatedAlerts.length > 0) {
    const { data: alerts, error: alertInsertError } = await supabase
      .from("alerts")
      .insert(
        generatedAlerts.map((alert) => ({
          tenant_id: tenantId,
          customer_id: input.customerId,
          transaction_id: transactionRow.id,
          alert_type: alert.alertType,
          severity: alert.severity,
          status: "open",
          description: alert.description,
          metadata: alert.metadata,
        })),
      )
      .select(
        "id, customer_id, transaction_id, verification_session_id, alert_type, severity, status, description, metadata, created_at",
      );

    if (alertInsertError) {
      throw new Error("Transaction stored but alert generation failed.");
    }

    insertedAlerts = (alerts ?? []) as AlertRow[];
  }

  await writeAuditLog(supabase, {
    tenantId,
    actorUserId,
    entityType: "transaction",
    entityId: transactionRow.id,
    action: "transaction.ingested",
    metadata: {
      amount: input.amount,
      currency: input.currency.toUpperCase(),
      transactionType: input.transactionType,
      generatedAlerts: insertedAlerts.length,
      status: nextStatus,
    },
  });

  return {
    transaction: mapTransaction(transactionRow, customerRow),
    alerts: insertedAlerts.map((item) => mapAlert(item, customerRow)),
  };
}

export async function listTransactions(
  { supabase, tenantId }: Omit<TransactionRepositoryParams, "actorUserId">,
  filters: TransactionFilters,
) {
  let query = supabase
    .from("transactions")
    .select(
      "id, customer_id, amount, currency, transaction_type, status, counterparty_country, metadata, created_at",
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(120);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.customerId) {
    query = query.eq("customer_id", filters.customerId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load transactions.");
  }

  const transactionRows = (data ?? []) as TransactionRow[];
  const customerIds = Array.from(new Set(transactionRows.map((item) => item.customer_id)));
  const customerResult =
    customerIds.length > 0
      ? await supabase
          .from("customers")
          .select("id, first_name, last_name, email, risk_level")
          .eq("tenant_id", tenantId)
          .is("deleted_at", null)
          .in("id", customerIds)
      : { data: [], error: null };

  if (customerResult.error) {
    throw new Error("Unable to load customer context for transactions.");
  }

  const customerById = new Map(
    ((customerResult.data ?? []) as CustomerRow[]).map((item) => [item.id, item]),
  );
  const mapped = transactionRows.map((item) =>
    mapTransaction(item, customerById.get(item.customer_id)),
  );

  if (!filters.query) {
    return mapped;
  }

  return mapped.filter((item) => {
    const haystack = [
      item.customerName,
      item.customerEmail ?? "",
      item.transactionType,
      item.currency,
      item.counterpartyCountry ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(filters.query?.toLowerCase() ?? "");
  });
}

export async function listAlerts(
  { supabase, tenantId }: Omit<TransactionRepositoryParams, "actorUserId">,
  filters: AlertFilters,
) {
  let query = supabase
    .from("alerts")
    .select(
      "id, customer_id, transaction_id, verification_session_id, alert_type, severity, status, description, metadata, created_at",
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(150);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.severity) {
    query = query.eq("severity", filters.severity);
  }

  if (filters.customerId) {
    query = query.eq("customer_id", filters.customerId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load monitoring alerts.");
  }

  const alertRows = (data ?? []) as AlertRow[];
  const customerIds = Array.from(
    new Set(
      alertRows
        .map((item) => item.customer_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const customerResult =
    customerIds.length > 0
      ? await supabase
          .from("customers")
          .select("id, first_name, last_name, email, risk_level")
          .eq("tenant_id", tenantId)
          .is("deleted_at", null)
          .in("id", customerIds)
      : { data: [], error: null };

  if (customerResult.error) {
    throw new Error("Unable to load customer context for alerts.");
  }

  const customerById = new Map(
    ((customerResult.data ?? []) as CustomerRow[]).map((item) => [item.id, item]),
  );

  return alertRows.map((item) =>
    mapAlert(item, item.customer_id ? customerById.get(item.customer_id) : undefined),
  );
}

export async function updateAlertStatus(
  { supabase, tenantId, actorUserId }: TransactionRepositoryParams,
  alertId: string,
  status: AlertStatus,
) {
  const { data: updatedAlert, error: updateAlertError } = await supabase
    .from("alerts")
    .update({ status })
    .eq("tenant_id", tenantId)
    .eq("id", alertId)
    .select(
      "id, customer_id, transaction_id, verification_session_id, alert_type, severity, status, description, metadata, created_at",
    )
    .maybeSingle();

  if (updateAlertError || !updatedAlert) {
    throw new Error("Unable to update alert status.");
  }

  const alertRow = updatedAlert as AlertRow;

  if (alertRow.transaction_id && status === "resolved") {
    const { count, error: unresolvedCountError } = await supabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .eq("transaction_id", alertRow.transaction_id)
      .in("status", ["open", "acknowledged"]);

    if (unresolvedCountError) {
      throw new Error("Alert updated, but transaction status could not be recalculated.");
    }

    if ((count ?? 0) === 0) {
      const { error: transactionUpdateError } = await supabase
        .from("transactions")
        .update({ status: "cleared" })
        .eq("tenant_id", tenantId)
        .eq("id", alertRow.transaction_id);

      if (transactionUpdateError) {
        throw new Error("Alert updated, but transaction status update failed.");
      }
    }
  }

  await writeAuditLog(supabase, {
    tenantId,
    actorUserId,
    entityType: "alert",
    entityId: alertId,
    action: "alert.status_updated",
    metadata: {
      status,
      transactionId: alertRow.transaction_id,
    },
  });

  const customer =
    alertRow.customer_id !== null
      ? await supabase
          .from("customers")
          .select("id, first_name, last_name, email, risk_level")
          .eq("tenant_id", tenantId)
          .is("deleted_at", null)
          .eq("id", alertRow.customer_id)
          .maybeSingle()
      : null;

  if (customer && customer.error) {
    throw new Error("Alert status updated, but customer context retrieval failed.");
  }

  return mapAlert(alertRow, (customer?.data as CustomerRow | null) ?? undefined);
}
