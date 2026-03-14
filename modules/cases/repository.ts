import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/modules/audit/repository";
import type {
  CaseFilters,
  CaseRecord,
  ComplianceOfficerRecord,
  CreateCaseInput,
  UpdateCaseInput,
} from "@/modules/cases/types";

type CaseRepositoryParams = {
  supabase: SupabaseClient;
  tenantId: string;
  actorUserId?: string | null;
};

type CaseRow = {
  id: string;
  verification_session_id: string | null;
  assigned_to: string | null;
  status: "open" | "in_review" | "resolved" | "closed";
  resolution_decision: "approved" | "rejected" | "manual_review" | null;
  priority: "low" | "medium" | "high" | "critical";
  notes: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

type VerificationRow = {
  id: string;
  customer_id: string;
};

type CustomerRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
};

type UserRow = {
  id: string;
  full_name: string | null;
  email: string;
  role: "admin" | "compliance_officer" | "developer";
};

function fullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function includesQuery(haystack: string, query: string) {
  return haystack.toLowerCase().includes(query.toLowerCase());
}

async function getCaseContext(
  supabase: SupabaseClient,
  tenantId: string,
  cases: CaseRow[],
) {
  const verificationIds = Array.from(
    new Set(
      cases
        .map((item) => item.verification_session_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const assignedIds = Array.from(
    new Set(
      cases
        .map((item) => item.assigned_to)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const [verificationResult, usersResult] = await Promise.all([
    verificationIds.length > 0
      ? supabase
          .from("verification_sessions")
          .select("id, customer_id")
          .eq("tenant_id", tenantId)
          .in("id", verificationIds)
      : Promise.resolve({ data: [], error: null }),
    assignedIds.length > 0
      ? supabase
          .from("users")
          .select("id, full_name, email, role")
          .eq("tenant_id", tenantId)
          .is("deleted_at", null)
          .in("id", assignedIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (verificationResult.error) {
    throw new Error("Unable to load verification context for cases.");
  }

  if (usersResult.error) {
    throw new Error("Unable to load assignee context for cases.");
  }

  const verificationRows = (verificationResult.data ?? []) as VerificationRow[];
  const sessionById = new Map(verificationRows.map((item) => [item.id, item]));

  const customerIds = Array.from(
    new Set(verificationRows.map((item) => item.customer_id)),
  );

  const customerResult =
    customerIds.length > 0
      ? await supabase
          .from("customers")
          .select("id, first_name, last_name, email")
          .eq("tenant_id", tenantId)
          .is("deleted_at", null)
          .in("id", customerIds)
      : { data: [], error: null };

  if (customerResult.error) {
    throw new Error("Unable to load customer context for cases.");
  }

  const customerById = new Map(
    ((customerResult.data ?? []) as CustomerRow[]).map((item) => [item.id, item]),
  );
  const userById = new Map(
    ((usersResult.data ?? []) as UserRow[]).map((item) => [item.id, item]),
  );

  return {
    sessionById,
    customerById,
    userById,
  };
}

function mapCase(
  row: CaseRow,
  context: {
    sessionById: Map<string, VerificationRow>;
    customerById: Map<string, CustomerRow>;
    userById: Map<string, UserRow>;
  },
): CaseRecord {
  const session = row.verification_session_id
    ? context.sessionById.get(row.verification_session_id)
    : null;
  const customer = session ? context.customerById.get(session.customer_id) : null;
  const assignee = row.assigned_to ? context.userById.get(row.assigned_to) : null;

  return {
    id: row.id,
    verificationSessionId: row.verification_session_id,
    customerId: session?.customer_id ?? null,
    customerName: customer ? fullName(customer.first_name, customer.last_name) : "Unlinked customer",
    customerEmail: customer?.email ?? null,
    assignedTo: row.assigned_to,
    assignedOfficerName: assignee?.full_name ?? null,
    assignedOfficerEmail: assignee?.email ?? null,
    status: row.status,
    resolutionDecision: row.resolution_decision,
    priority: row.priority,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at,
  };
}

async function ensureAssignableOfficer(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("users")
    .select("id, role")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Assigned user was not found in this workspace.");
  }

  const role = (data as { role: string }).role;

  if (role !== "admin" && role !== "compliance_officer") {
    throw new Error("Assigned user must be an admin or compliance officer.");
  }
}

async function ensureVerificationSession(
  supabase: SupabaseClient,
  tenantId: string,
  verificationSessionId: string,
) {
  const { data, error } = await supabase
    .from("verification_sessions")
    .select("id")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .eq("id", verificationSessionId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Verification session was not found for case creation.");
  }
}

export async function listCases(
  { supabase, tenantId }: CaseRepositoryParams,
  filters: CaseFilters,
) {
  let query = supabase
    .from("cases")
    .select(
      "id, verification_session_id, assigned_to, status, resolution_decision, priority, notes, created_at, updated_at, closed_at",
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(120);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.priority) {
    query = query.eq("priority", filters.priority);
  }

  if (filters.assignedTo) {
    query = query.eq("assigned_to", filters.assignedTo);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load compliance cases.");
  }

  const rows = (data ?? []) as CaseRow[];

  if (rows.length === 0) {
    return [] as CaseRecord[];
  }

  const context = await getCaseContext(supabase, tenantId, rows);
  const mapped = rows.map((row) => mapCase(row, context));

  if (!filters.query) {
    return mapped;
  }

  return mapped.filter((item) => {
    const haystack = [
      item.id,
      item.customerName,
      item.customerEmail ?? "",
      item.assignedOfficerName ?? "",
      item.assignedOfficerEmail ?? "",
      item.notes ?? "",
    ].join(" ");

    return includesQuery(haystack, filters.query ?? "");
  });
}

export async function listComplianceOfficers({
  supabase,
  tenantId,
}: Omit<CaseRepositoryParams, "actorUserId">) {
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, role")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .in("role", ["admin", "compliance_officer"])
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Unable to load compliance officers.");
  }

  return ((data ?? []) as UserRow[]).map(
    (item): ComplianceOfficerRecord => ({
      id: item.id,
      fullName: item.full_name,
      email: item.email,
      role: item.role,
    }),
  );
}

export async function createCase(
  { supabase, tenantId, actorUserId }: CaseRepositoryParams,
  input: CreateCaseInput,
) {
  if (input.verificationSessionId) {
    await ensureVerificationSession(supabase, tenantId, input.verificationSessionId);
  }

  if (input.assignedTo) {
    await ensureAssignableOfficer(supabase, tenantId, input.assignedTo);
  }

  const { data, error } = await supabase
    .from("cases")
    .insert({
      tenant_id: tenantId,
      verification_session_id: input.verificationSessionId ?? null,
      assigned_to: input.assignedTo ?? null,
      priority: input.priority,
      notes: input.notes ?? null,
      status: input.assignedTo ? "in_review" : "open",
    })
    .select(
      "id, verification_session_id, assigned_to, status, resolution_decision, priority, notes, created_at, updated_at, closed_at",
    )
    .single();

  if (error || !data) {
    throw new Error("Unable to create compliance case.");
  }

  await writeAuditLog(supabase, {
    tenantId,
    actorUserId,
    entityType: "case",
    entityId: (data as CaseRow).id,
    action: "case.created",
    metadata: {
      verificationSessionId: input.verificationSessionId ?? null,
      assignedTo: input.assignedTo ?? null,
      priority: input.priority,
    },
  });

  const mapped = await listCases(
    { supabase, tenantId, actorUserId },
    { assignedTo: undefined },
  );
  const created = mapped.find((item) => item.id === (data as CaseRow).id);

  if (!created) {
    throw new Error("Case created but unable to load response context.");
  }

  return created;
}

export async function updateCase(
  { supabase, tenantId, actorUserId }: CaseRepositoryParams,
  caseId: string,
  input: UpdateCaseInput,
) {
  const { data: existingCase, error: existingCaseError } = await supabase
    .from("cases")
    .select("id, status, resolution_decision")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .eq("id", caseId)
    .maybeSingle();

  if (existingCaseError || !existingCase) {
    throw new Error("Case was not found.");
  }

  if (typeof input.assignedTo === "string") {
    await ensureAssignableOfficer(supabase, tenantId, input.assignedTo);
  }

  const nextStatus = input.status ?? undefined;
  const nextResolution = input.resolutionDecision ?? undefined;

  const payload: Record<string, unknown> = {};

  if (nextStatus) {
    payload.status = nextStatus;
  }

  if (nextResolution) {
    payload.resolution_decision = nextResolution;
    if (!nextStatus) {
      payload.status = "resolved";
    }
  }

  if (input.assignedTo !== undefined) {
    payload.assigned_to = input.assignedTo;
  }

  if (input.notes !== undefined) {
    payload.notes = input.notes;
  }

  const closingStatus = (payload.status ??
    (existingCase as { status: string }).status) as string;

  if (closingStatus === "resolved" || closingStatus === "closed") {
    payload.closed_at = new Date().toISOString();
  } else if (closingStatus === "open" || closingStatus === "in_review") {
    payload.closed_at = null;
  }

  const { error: updateError } = await supabase
    .from("cases")
    .update(payload)
    .eq("tenant_id", tenantId)
    .eq("id", caseId);

  if (updateError) {
    throw new Error("Unable to update case.");
  }

  await writeAuditLog(supabase, {
    tenantId,
    actorUserId,
    entityType: "case",
    entityId: caseId,
    action: "case.updated",
    metadata: {
      status: payload.status ?? null,
      resolutionDecision: payload.resolution_decision ?? null,
      assignedTo: payload.assigned_to ?? null,
    },
  });

  const mapped = await listCases(
    { supabase, tenantId, actorUserId },
    { assignedTo: undefined },
  );
  const updated = mapped.find((item) => item.id === caseId);

  if (!updated) {
    throw new Error("Case updated but unable to load response context.");
  }

  return updated;
}
