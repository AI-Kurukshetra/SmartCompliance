import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const envPath = path.join(projectRoot, ".env.local");

const SEED_TAG = "seed_relevant_v1";

function parseDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  const entries = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
}

function loadEnv() {
  const localEnv = parseDotEnvFile(envPath);
  for (const [key, value] of Object.entries(localEnv)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function getArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

function assertNoError(result, context) {
  if (result.error) {
    throw new Error(`${context}: ${result.error.message}`);
  }
}

async function removeExistingSeedData(supabase, tenantId) {
  const operations = [
    async () =>
      supabase
        .from("audit_logs")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("metadata->>seed_tag", SEED_TAG),
    async () =>
      supabase
        .from("alerts")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("metadata->>seed_tag", SEED_TAG),
    async () =>
      supabase
        .from("transactions")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("metadata->>seed_tag", SEED_TAG),
    async () =>
      supabase
        .from("cases")
        .delete()
        .eq("tenant_id", tenantId)
        .ilike("notes", `%[${SEED_TAG}]%`),
    async () =>
      supabase
        .from("risk_profiles")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("factors->>seed_tag", SEED_TAG),
    async () =>
      supabase
        .from("watchlist_results")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("match_details->>seed_tag", SEED_TAG),
    async () =>
      supabase
        .from("documents")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("ocr_data->>seed_tag", SEED_TAG),
    async () =>
      supabase
        .from("verification_sessions")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("metadata->>seed_tag", SEED_TAG),
    async () =>
      supabase
        .from("customers")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("metadata->>seed_tag", SEED_TAG),
    async () =>
      supabase
        .from("reports")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("report_data->>seed_tag", SEED_TAG),
    async () =>
      supabase
        .from("rules")
        .delete()
        .eq("tenant_id", tenantId)
        .like("name", "[SEED] %"),
  ];

  for (const operation of operations) {
    const result = await operation();
    assertNoError(result, "Failed clearing previous seeded data");
  }
}

async function resolveTenant(supabase, preferredSlug) {
  if (preferredSlug) {
    const slugResult = await supabase
      .from("tenants")
      .select("id, name, slug, created_at")
      .eq("slug", preferredSlug)
      .is("deleted_at", null)
      .maybeSingle();
    assertNoError(slugResult, "Unable to resolve tenant by slug");

    if (slugResult.data) {
      return slugResult.data;
    }
  }

  const latestResult = await supabase
    .from("tenants")
    .select("id, name, slug, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  assertNoError(latestResult, "Unable to resolve tenant");

  if (!latestResult.data) {
    throw new Error(
      "No tenant found. Create a workspace first, then run the seed script.",
    );
  }

  return latestResult.data;
}

async function seed() {
  loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.",
    );
  }

  const tenantSlugFromArg =
    getArg("tenant-slug") || process.env.SEED_TENANT_SLUG || undefined;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tenant = await resolveTenant(supabase, tenantSlugFromArg);
  const tenantId = tenant.id;

  const actorResult = await supabase
    .from("users")
    .select("id, email, full_name")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  assertNoError(actorResult, "Unable to resolve seed actor");

  const actorUserId = actorResult.data?.id ?? null;
  await removeExistingSeedData(supabase, tenantId);

  const customersPayload = [
    {
      first_name: "Aarav",
      last_name: "Sharma",
      email: "aarav.seed1@seed.smartcompliance.local",
      phone: "+1 202 555 0101",
      date_of_birth: "1992-04-18",
      country_code: "US",
      risk_level: "low",
      metadata: { seed_tag: SEED_TAG, profile: "salary-earner" },
    },
    {
      first_name: "Maya",
      last_name: "Patel",
      email: "maya.seed2@seed.smartcompliance.local",
      phone: "+1 202 555 0102",
      date_of_birth: "1988-12-07",
      country_code: "GB",
      risk_level: "medium",
      metadata: { seed_tag: SEED_TAG, profile: "international-remittance" },
    },
    {
      first_name: "Liam",
      last_name: "Nguyen",
      email: "liam.seed3@seed.smartcompliance.local",
      phone: "+1 202 555 0103",
      date_of_birth: "1995-06-23",
      country_code: "CA",
      risk_level: "medium",
      metadata: { seed_tag: SEED_TAG, profile: "crypto-user" },
    },
    {
      first_name: "Fatima",
      last_name: "Khan",
      email: "fatima.seed4@seed.smartcompliance.local",
      phone: "+1 202 555 0104",
      date_of_birth: "1985-10-12",
      country_code: "AE",
      risk_level: "high",
      metadata: { seed_tag: SEED_TAG, profile: "high-value-transfers" },
    },
    {
      first_name: "Noah",
      last_name: "Martinez",
      email: "noah.seed5@seed.smartcompliance.local",
      phone: "+1 202 555 0105",
      date_of_birth: "1990-02-02",
      country_code: "US",
      risk_level: "critical",
      metadata: { seed_tag: SEED_TAG, profile: "sanction-screening-hit" },
    },
    {
      first_name: "Olivia",
      last_name: "Davis",
      email: "olivia.seed6@seed.smartcompliance.local",
      phone: "+1 202 555 0106",
      date_of_birth: "1998-08-29",
      country_code: "US",
      risk_level: "low",
      metadata: { seed_tag: SEED_TAG, profile: "new-onboarding" },
    },
  ].map((item) => ({
    tenant_id: tenantId,
    ...item,
  }));

  const customersResult = await supabase
    .from("customers")
    .insert(customersPayload)
    .select("id, first_name, last_name, email");
  assertNoError(customersResult, "Unable to seed customers");
  const customers = customersResult.data ?? [];

  const customerByEmail = new Map(customers.map((row) => [row.email, row]));
  const c1 = customerByEmail.get("aarav.seed1@seed.smartcompliance.local");
  const c2 = customerByEmail.get("maya.seed2@seed.smartcompliance.local");
  const c3 = customerByEmail.get("liam.seed3@seed.smartcompliance.local");
  const c4 = customerByEmail.get("fatima.seed4@seed.smartcompliance.local");
  const c5 = customerByEmail.get("noah.seed5@seed.smartcompliance.local");
  const c6 = customerByEmail.get("olivia.seed6@seed.smartcompliance.local");

  if (!c1 || !c2 || !c3 || !c4 || !c5 || !c6) {
    throw new Error("Customer seed mapping failed.");
  }

  const verificationPayload = [
    {
      tenant_id: tenantId,
      customer_id: c1.id,
      status: "approved",
      decision: "approved",
      risk_score: 12,
      completed_at: new Date().toISOString(),
      metadata: { seed_tag: SEED_TAG, scenario: "clean-approval" },
    },
    {
      tenant_id: tenantId,
      customer_id: c2.id,
      status: "review",
      decision: "manual_review",
      risk_score: 47,
      metadata: { seed_tag: SEED_TAG, scenario: "manual-review" },
    },
    {
      tenant_id: tenantId,
      customer_id: c3.id,
      status: "screening",
      decision: "manual_review",
      risk_score: 34,
      metadata: { seed_tag: SEED_TAG, scenario: "screening-in-progress" },
    },
    {
      tenant_id: tenantId,
      customer_id: c4.id,
      status: "review",
      decision: "manual_review",
      risk_score: 66,
      metadata: { seed_tag: SEED_TAG, scenario: "high-risk-review" },
    },
    {
      tenant_id: tenantId,
      customer_id: c5.id,
      status: "rejected",
      decision: "rejected",
      risk_score: 92,
      completed_at: new Date().toISOString(),
      metadata: { seed_tag: SEED_TAG, scenario: "confirmed-match-reject" },
    },
    {
      tenant_id: tenantId,
      customer_id: c6.id,
      status: "pending",
      decision: "manual_review",
      risk_score: 0,
      metadata: { seed_tag: SEED_TAG, scenario: "new-session-pending" },
    },
  ];

  const verificationsResult = await supabase
    .from("verification_sessions")
    .insert(verificationPayload)
    .select("id, customer_id, status");
  assertNoError(verificationsResult, "Unable to seed verification sessions");
  const verificationSessions = verificationsResult.data ?? [];
  const sessionByCustomerId = new Map(
    verificationSessions.map((item) => [item.customer_id, item]),
  );

  const s1 = sessionByCustomerId.get(c1.id);
  const s2 = sessionByCustomerId.get(c2.id);
  const s3 = sessionByCustomerId.get(c3.id);
  const s4 = sessionByCustomerId.get(c4.id);
  const s5 = sessionByCustomerId.get(c5.id);
  if (!s1 || !s2 || !s3 || !s4 || !s5) {
    throw new Error("Verification seed mapping failed.");
  }

  const documentsPayload = [
    {
      tenant_id: tenantId,
      customer_id: c1.id,
      verification_session_id: s1.id,
      document_type: "passport",
      storage_path: `seed/${SEED_TAG}/passport-c1.jpg`,
      mime_type: "image/jpeg",
      status: "verified",
      document_confidence: 94.4,
      ocr_data: { seed_tag: SEED_TAG, name: "Aarav Sharma", doc_no: "P-1001" },
    },
    {
      tenant_id: tenantId,
      customer_id: c2.id,
      verification_session_id: s2.id,
      document_type: "driver_license",
      storage_path: `seed/${SEED_TAG}/dl-c2.jpg`,
      mime_type: "image/jpeg",
      status: "verified",
      document_confidence: 82.1,
      ocr_data: { seed_tag: SEED_TAG, name: "Maya Patel", doc_no: "DL-2002" },
    },
    {
      tenant_id: tenantId,
      customer_id: c3.id,
      verification_session_id: s3.id,
      document_type: "national_id",
      storage_path: `seed/${SEED_TAG}/nid-c3.jpg`,
      mime_type: "image/jpeg",
      status: "processing",
      document_confidence: null,
      ocr_data: { seed_tag: SEED_TAG, stage: "processing" },
    },
    {
      tenant_id: tenantId,
      customer_id: c4.id,
      verification_session_id: s4.id,
      document_type: "passport",
      storage_path: `seed/${SEED_TAG}/passport-c4.jpg`,
      mime_type: "image/jpeg",
      status: "verified",
      document_confidence: 71.8,
      ocr_data: { seed_tag: SEED_TAG, name: "Fatima Khan", doc_no: "P-4004" },
    },
    {
      tenant_id: tenantId,
      customer_id: c5.id,
      verification_session_id: s5.id,
      document_type: "passport",
      storage_path: `seed/${SEED_TAG}/passport-c5.jpg`,
      mime_type: "image/jpeg",
      status: "verified",
      document_confidence: 88.5,
      ocr_data: { seed_tag: SEED_TAG, name: "Noah Martinez", doc_no: "P-5005" },
    },
  ];

  const documentsResult = await supabase.from("documents").insert(documentsPayload);
  assertNoError(documentsResult, "Unable to seed documents");

  const watchlistPayload = [
    {
      tenant_id: tenantId,
      verification_session_id: s1.id,
      provider: "ofac_placeholder",
      status: "clear",
      match_score: 2.3,
      match_details: { seed_tag: SEED_TAG, note: "No match" },
    },
    {
      tenant_id: tenantId,
      verification_session_id: s2.id,
      provider: "pep_placeholder",
      status: "possible_match",
      match_score: 63.5,
      match_details: { seed_tag: SEED_TAG, note: "Potential PEP name similarity" },
    },
    {
      tenant_id: tenantId,
      verification_session_id: s4.id,
      provider: "sanctions_placeholder",
      status: "manual_review",
      match_score: 51.2,
      match_details: { seed_tag: SEED_TAG, note: "Needs analyst confirmation" },
    },
    {
      tenant_id: tenantId,
      verification_session_id: s5.id,
      provider: "ofac_placeholder",
      status: "confirmed_match",
      match_score: 96.8,
      match_details: { seed_tag: SEED_TAG, note: "Confirmed sanctions entity match" },
    },
  ];

  const watchlistResult = await supabase
    .from("watchlist_results")
    .insert(watchlistPayload);
  assertNoError(watchlistResult, "Unable to seed watchlist results");

  const riskProfilePayload = [
    {
      tenant_id: tenantId,
      customer_id: c1.id,
      verification_session_id: s1.id,
      risk_score: 12,
      risk_level: "low",
      factors: {
        seed_tag: SEED_TAG,
        applied_factors: ["Verified document", "Watchlist clear"],
      },
    },
    {
      tenant_id: tenantId,
      customer_id: c2.id,
      verification_session_id: s2.id,
      risk_score: 47,
      risk_level: "medium",
      factors: {
        seed_tag: SEED_TAG,
        applied_factors: ["Possible watchlist match", "Moderate confidence documents"],
      },
    },
    {
      tenant_id: tenantId,
      customer_id: c4.id,
      verification_session_id: s4.id,
      risk_score: 66,
      risk_level: "high",
      factors: {
        seed_tag: SEED_TAG,
        applied_factors: ["Manual review watchlist signal", "Lower document confidence"],
      },
    },
    {
      tenant_id: tenantId,
      customer_id: c5.id,
      verification_session_id: s5.id,
      risk_score: 92,
      risk_level: "critical",
      factors: {
        seed_tag: SEED_TAG,
        applied_factors: ["Confirmed watchlist match"],
      },
    },
  ];

  const riskProfilesResult = await supabase
    .from("risk_profiles")
    .insert(riskProfilePayload);
  assertNoError(riskProfilesResult, "Unable to seed risk profiles");

  const casesPayload = [
    {
      tenant_id: tenantId,
      verification_session_id: s2.id,
      assigned_to: actorUserId,
      status: "in_review",
      priority: "high",
      notes: `[${SEED_TAG}] Possible watchlist match - needs enhanced due diligence.`,
    },
    {
      tenant_id: tenantId,
      verification_session_id: s4.id,
      assigned_to: actorUserId,
      status: "open",
      priority: "medium",
      notes: `[${SEED_TAG}] Additional document request pending.`,
    },
    {
      tenant_id: tenantId,
      verification_session_id: s5.id,
      assigned_to: actorUserId,
      status: "resolved",
      priority: "critical",
      resolution_decision: "rejected",
      closed_at: new Date().toISOString(),
      notes: `[${SEED_TAG}] Confirmed sanctions match; onboarding rejected.`,
    },
  ];

  const casesResult = await supabase.from("cases").insert(casesPayload);
  assertNoError(casesResult, "Unable to seed cases");

  const transactionsPayload = [
    {
      tenant_id: tenantId,
      customer_id: c1.id,
      amount: 2400,
      currency: "USD",
      transaction_type: "card_payment",
      status: "cleared",
      counterparty_country: "US",
      metadata: { seed_tag: SEED_TAG, channel: "card" },
    },
    {
      tenant_id: tenantId,
      customer_id: c2.id,
      amount: 13200,
      currency: "USD",
      transaction_type: "bank_transfer",
      status: "flagged",
      counterparty_country: "GB",
      metadata: { seed_tag: SEED_TAG, channel: "wire" },
    },
    {
      tenant_id: tenantId,
      customer_id: c3.id,
      amount: 7200,
      currency: "USD",
      transaction_type: "crypto_transfer",
      status: "flagged",
      counterparty_country: "AE",
      metadata: { seed_tag: SEED_TAG, channel: "crypto" },
    },
    {
      tenant_id: tenantId,
      customer_id: c4.id,
      amount: 28500,
      currency: "USD",
      transaction_type: "bank_transfer",
      status: "blocked",
      counterparty_country: "RU",
      metadata: { seed_tag: SEED_TAG, channel: "wire" },
    },
    {
      tenant_id: tenantId,
      customer_id: c5.id,
      amount: 15100,
      currency: "USD",
      transaction_type: "bank_transfer",
      status: "flagged",
      counterparty_country: "IR",
      metadata: { seed_tag: SEED_TAG, channel: "wire" },
    },
    {
      tenant_id: tenantId,
      customer_id: c6.id,
      amount: 840,
      currency: "USD",
      transaction_type: "wallet_topup",
      status: "pending",
      counterparty_country: "US",
      metadata: { seed_tag: SEED_TAG, channel: "wallet" },
    },
  ];

  const transactionsResult = await supabase
    .from("transactions")
    .insert(transactionsPayload)
    .select("id, customer_id, amount, status");
  assertNoError(transactionsResult, "Unable to seed transactions");
  const transactions = transactionsResult.data ?? [];

  const txByCustomerId = new Map(transactions.map((tx) => [tx.customer_id, tx]));
  const txC2 = txByCustomerId.get(c2.id);
  const txC3 = txByCustomerId.get(c3.id);
  const txC4 = txByCustomerId.get(c4.id);
  const txC5 = txByCustomerId.get(c5.id);

  const alertsPayload = [
    {
      tenant_id: tenantId,
      customer_id: c2.id,
      transaction_id: txC2?.id ?? null,
      verification_session_id: s2.id,
      alert_type: "high_value_transaction",
      severity: "high",
      status: "open",
      description: "Transaction exceeds high-value threshold for profile.",
      metadata: { seed_tag: SEED_TAG, source: "transaction_monitoring" },
    },
    {
      tenant_id: tenantId,
      customer_id: c3.id,
      transaction_id: txC3?.id ?? null,
      verification_session_id: s3.id,
      alert_type: "crypto_exposure",
      severity: "medium",
      status: "acknowledged",
      description: "Crypto transfer requires manual review.",
      metadata: { seed_tag: SEED_TAG, source: "transaction_monitoring" },
    },
    {
      tenant_id: tenantId,
      customer_id: c4.id,
      transaction_id: txC4?.id ?? null,
      verification_session_id: s4.id,
      alert_type: "high_risk_jurisdiction",
      severity: "critical",
      status: "open",
      description: "Counterparty country is high risk.",
      metadata: { seed_tag: SEED_TAG, source: "transaction_monitoring" },
    },
    {
      tenant_id: tenantId,
      customer_id: c5.id,
      transaction_id: txC5?.id ?? null,
      verification_session_id: s5.id,
      alert_type: "sanctions_exposure",
      severity: "critical",
      status: "resolved",
      description: "Confirmed sanctions relation - transaction blocked.",
      metadata: { seed_tag: SEED_TAG, source: "watchlist_screening" },
    },
  ];

  const alertsResult = await supabase.from("alerts").insert(alertsPayload);
  assertNoError(alertsResult, "Unable to seed alerts");

  const rulesPayload = [
    {
      tenant_id: tenantId,
      name: "[SEED] Possible Match Escalation",
      description: "Adds risk for possible or confirmed watchlist matches.",
      condition: { watchlist_status_in: ["possible_match", "confirmed_match"] },
      score: 35,
      decision_action: "manual_review",
      enabled: true,
      version: 1,
    },
    {
      tenant_id: tenantId,
      name: "[SEED] Confirmed Match Reject",
      description: "Force reject when confirmed match appears.",
      condition: { watchlist_status_in: ["confirmed_match"] },
      score: 65,
      decision_action: "rejected",
      enabled: true,
      version: 1,
    },
    {
      tenant_id: tenantId,
      name: "[SEED] Missing Document Penalty",
      description: "Raise risk when no document exists.",
      condition: { missing_documents: true },
      score: 20,
      decision_action: "manual_review",
      enabled: true,
      version: 1,
    },
    {
      tenant_id: tenantId,
      name: "[SEED] Low Confidence Trigger",
      description: "Raise risk when document confidence is low.",
      condition: { max_document_confidence: 80 },
      score: 25,
      decision_action: "manual_review",
      enabled: true,
      version: 1,
    },
  ];

  const rulesResult = await supabase.from("rules").insert(rulesPayload);
  assertNoError(rulesResult, "Unable to seed rules");

  const nowIso = new Date().toISOString();
  const reportsPayload = [
    {
      tenant_id: tenantId,
      report_type: "sar",
      status: "ready",
      generated_by: actorUserId,
      completed_at: nowIso,
      report_data: {
        seed_tag: SEED_TAG,
        summary: { suspicious_alerts: 3, critical_alerts: 2 },
        items: [
          { alert_type: "high_risk_jurisdiction", severity: "critical" },
          { alert_type: "sanctions_exposure", severity: "critical" },
          { alert_type: "high_value_transaction", severity: "high" },
        ],
      },
    },
    {
      tenant_id: tenantId,
      report_type: "ctr",
      status: "ready",
      generated_by: actorUserId,
      completed_at: nowIso,
      report_data: {
        seed_tag: SEED_TAG,
        summary: { transactions_over_threshold: 3, total_amount: 56800 },
        items: [
          { amount: 13200, currency: "USD" },
          { amount: 28500, currency: "USD" },
          { amount: 15100, currency: "USD" },
        ],
      },
    },
    {
      tenant_id: tenantId,
      report_type: "audit_export",
      status: "ready",
      generated_by: actorUserId,
      completed_at: nowIso,
      report_data: {
        seed_tag: SEED_TAG,
        summary: { audit_events: 4 },
        items: [
          { action: "customer.seeded" },
          { action: "verification.seeded" },
          { action: "monitoring.seeded" },
          { action: "rules.seeded" },
        ],
      },
    },
    {
      tenant_id: tenantId,
      report_type: "operations_summary",
      status: "ready",
      generated_by: actorUserId,
      completed_at: nowIso,
      report_data: {
        seed_tag: SEED_TAG,
        summary: {
          verifications: 6,
          alerts: 4,
          cases: 3,
          reports: 4,
        },
        items: [
          { metric: "verifications", value: 6 },
          { metric: "alerts", value: 4 },
          { metric: "cases", value: 3 },
          { metric: "reports_generated", value: 4 },
        ],
      },
    },
  ];

  const reportsResult = await supabase.from("reports").insert(reportsPayload);
  assertNoError(reportsResult, "Unable to seed reports");

  const auditPayload = [
    {
      tenant_id: tenantId,
      actor_user_id: actorUserId,
      entity_type: "seed",
      entity_id: null,
      action: "seed.run_started",
      metadata: { seed_tag: SEED_TAG },
    },
    {
      tenant_id: tenantId,
      actor_user_id: actorUserId,
      entity_type: "customer",
      entity_id: c1.id,
      action: "seed.customer_inserted",
      metadata: { seed_tag: SEED_TAG, email: c1.email },
    },
    {
      tenant_id: tenantId,
      actor_user_id: actorUserId,
      entity_type: "verification",
      entity_id: s2.id,
      action: "seed.verification_inserted",
      metadata: { seed_tag: SEED_TAG, status: "review" },
    },
    {
      tenant_id: tenantId,
      actor_user_id: actorUserId,
      entity_type: "seed",
      entity_id: null,
      action: "seed.run_completed",
      metadata: { seed_tag: SEED_TAG },
    },
  ];

  const auditResult = await supabase.from("audit_logs").insert(auditPayload);
  assertNoError(auditResult, "Unable to seed audit logs");

  const summary = {
    tenant: `${tenant.name} (${tenant.slug})`,
    actor: actorResult.data?.email ?? "none",
    seeded: {
      customers: customersPayload.length,
      verification_sessions: verificationPayload.length,
      documents: documentsPayload.length,
      watchlist_results: watchlistPayload.length,
      risk_profiles: riskProfilePayload.length,
      cases: casesPayload.length,
      transactions: transactionsPayload.length,
      alerts: alertsPayload.length,
      rules: rulesPayload.length,
      reports: reportsPayload.length,
      audit_logs: auditPayload.length,
    },
    seed_tag: SEED_TAG,
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

seed().catch((error) => {
  process.stderr.write(`[seed:relevant] ${error.message}\n`);
  process.exit(1);
});
