import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateVerificationSessionInput,
  VerificationDocumentFilters,
  VerificationDocumentRecord,
  VerificationFilters,
  VerificationRecord,
  VerificationStatus,
  UploadDocumentPlaceholderInput,
} from "@/modules/verifications/types";

type VerificationRow = {
  id: string;
  customer_id: string;
  status: VerificationStatus;
  decision: "approved" | "rejected" | "manual_review";
  risk_score: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
};

type DocumentRow = {
  id: string;
  verification_session_id: string;
  customer_id: string;
  document_type: string;
  storage_path: string;
  mime_type: string | null;
  status: "uploaded" | "processing" | "verified" | "rejected";
  document_confidence: number | null;
  ocr_data: Record<string, unknown> | null;
  created_at: string;
};

type CustomerRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
};

type VerificationRepositoryParams = {
  supabase: SupabaseClient;
  tenantId: string;
};

function sanitizeSearchValue(value: string) {
  return value.replace(/[%(),]/g, " ").trim();
}

function normalizeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapVerification(
  row: VerificationRow,
  customerLookup: Record<string, CustomerRow>,
): VerificationRecord {
  const customer = customerLookup[row.customer_id];
  const firstName = customer?.first_name ?? "Unknown";
  const lastName = customer?.last_name ?? "Customer";

  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: `${firstName} ${lastName}`.trim(),
    customerEmail: customer?.email ?? null,
    status: row.status,
    decision: row.decision,
    riskScore: row.risk_score,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

function mapDocument(row: DocumentRow): VerificationDocumentRecord {
  return {
    id: row.id,
    verificationSessionId: row.verification_session_id,
    customerId: row.customer_id,
    documentType: row.document_type,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    status: row.status,
    documentConfidence: row.document_confidence,
    ocrData: row.ocr_data ?? {},
    createdAt: row.created_at,
  };
}

function buildOcrPlaceholder(input: {
  documentType: string;
  customerName: string;
}) {
  const processedAt = new Date().toISOString();
  const randomSuffix = Math.floor(Math.random() * 900000 + 100000).toString();
  const confidence = Number((78 + Math.random() * 19).toFixed(2));

  return {
    confidence,
    data: {
      processor: "ocr_placeholder_v1",
      processed_at: processedAt,
      extracted_document_number: `DOC-${randomSuffix}`,
      extracted_full_name: input.customerName,
      extracted_document_type: input.documentType,
      review_flags: [] as string[],
    },
  };
}

async function loadCustomerLookup(
  supabase: SupabaseClient,
  tenantId: string,
  customerIds: string[],
) {
  if (customerIds.length === 0) {
    return {} as Record<string, CustomerRow>;
  }

  const { data, error } = await supabase
    .from("customers")
    .select("id, first_name, last_name, email")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .in("id", customerIds);

  if (error) {
    throw new Error("Unable to load customer details for verification sessions.");
  }

  return (data ?? []).reduce<Record<string, CustomerRow>>((acc, row) => {
    const customer = row as CustomerRow;
    acc[customer.id] = customer;
    return acc;
  }, {});
}

export async function listVerificationSessions(
  { supabase, tenantId }: VerificationRepositoryParams,
  filters: VerificationFilters,
) {
  let query = supabase
    .from("verification_sessions")
    .select(
      "id, customer_id, status, decision, risk_score, started_at, completed_at, created_at",
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.query) {
    const search = sanitizeSearchValue(filters.query);

    if (search) {
      const { data: customerMatches, error: customerFilterError } = await supabase
        .from("customers")
        .select("id")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`,
        )
        .limit(100);

      if (customerFilterError) {
        throw new Error("Unable to apply customer search filter.");
      }

      const matchingIds = (customerMatches ?? []).map(
        (row) => (row as { id: string }).id,
      );

      if (matchingIds.length === 0) {
        return [];
      }

      query = query.in("customer_id", matchingIds);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load verification sessions.");
  }

  const rows = (data ?? []) as VerificationRow[];
  const uniqueCustomerIds = [...new Set(rows.map((row) => row.customer_id))];
  const customerLookup = await loadCustomerLookup(
    supabase,
    tenantId,
    uniqueCustomerIds,
  );

  return rows.map((row) => mapVerification(row, customerLookup));
}

export async function createVerificationSession(
  { supabase, tenantId }: VerificationRepositoryParams,
  input: CreateVerificationSessionInput,
) {
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, first_name, last_name, email")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .eq("id", input.customerId)
    .maybeSingle();

  if (customerError || !customer) {
    throw new Error("Customer was not found in this tenant.");
  }

  const { data, error } = await supabase
    .from("verification_sessions")
    .insert({
      tenant_id: tenantId,
      customer_id: input.customerId,
      status: "pending",
      decision: "manual_review",
      risk_score: 0,
    })
    .select(
      "id, customer_id, status, decision, risk_score, started_at, completed_at, created_at",
    )
    .single();

  if (error || !data) {
    throw new Error("Unable to create verification session.");
  }

  return mapVerification(data as VerificationRow, {
    [input.customerId]: customer as CustomerRow,
  });
}

export async function listVerificationDocuments(
  { supabase, tenantId }: VerificationRepositoryParams,
  filters: VerificationDocumentFilters,
) {
  let query = supabase
    .from("documents")
    .select(
      "id, verification_session_id, customer_id, document_type, storage_path, mime_type, status, document_confidence, ocr_data, created_at",
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
    throw new Error("Unable to load verification documents.");
  }

  return ((data ?? []) as DocumentRow[]).map((row) => mapDocument(row));
}

export async function uploadDocumentPlaceholder(
  { supabase, tenantId }: VerificationRepositoryParams,
  input: UploadDocumentPlaceholderInput,
) {
  const { data: session, error: sessionError } = await supabase
    .from("verification_sessions")
    .select("id, customer_id")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .eq("id", input.verificationSessionId)
    .maybeSingle();

  if (sessionError || !session) {
    throw new Error("Verification session was not found.");
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, first_name, last_name")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .eq("id", (session as { customer_id: string }).customer_id)
    .maybeSingle();

  if (customerError || !customer) {
    throw new Error("Linked customer for the verification session was not found.");
  }

  const safeName = normalizeFileName(
    input.fileName ?? `${input.documentType}-${Date.now()}`,
  );
  const storagePath = `placeholder/${tenantId}/${input.verificationSessionId}/${safeName || "document"}`;

  const { data: insertedDocument, error: insertError } = await supabase
    .from("documents")
    .insert({
      tenant_id: tenantId,
      customer_id: (session as { customer_id: string }).customer_id,
      verification_session_id: input.verificationSessionId,
      document_type: input.documentType,
      storage_path: storagePath,
      mime_type: input.mimeType ?? "application/octet-stream",
      status: "processing",
    })
    .select(
      "id, verification_session_id, customer_id, document_type, storage_path, mime_type, status, document_confidence, ocr_data, created_at",
    )
    .single();

  if (insertError || !insertedDocument) {
    throw new Error("Unable to register uploaded document.");
  }

  const fullName = `${(customer as { first_name: string }).first_name} ${
    (customer as { last_name: string }).last_name
  }`.trim();
  const placeholder = buildOcrPlaceholder({
    documentType: input.documentType,
    customerName: fullName || "Unknown Customer",
  });

  const { data: updatedDocument, error: updateError } = await supabase
    .from("documents")
    .update({
      status: "verified",
      document_confidence: placeholder.confidence,
      ocr_data: placeholder.data,
    })
    .eq("id", (insertedDocument as { id: string }).id)
    .eq("tenant_id", tenantId)
    .select(
      "id, verification_session_id, customer_id, document_type, storage_path, mime_type, status, document_confidence, ocr_data, created_at",
    )
    .single();

  if (updateError || !updatedDocument) {
    throw new Error("Unable to store OCR placeholder results.");
  }

  await supabase
    .from("verification_sessions")
    .update({
      status: "screening",
    })
    .eq("tenant_id", tenantId)
    .eq("id", input.verificationSessionId);

  return mapDocument(updatedDocument as DocumentRow);
}
