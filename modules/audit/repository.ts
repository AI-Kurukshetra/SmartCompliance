import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditEventInput = {
  tenantId: string;
  actorUserId?: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  metadata?: Record<string, unknown>;
};

export type AuditLogRecord = {
  id: string;
  actorUserId: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

type AuditLogRow = {
  id: string;
  actor_user_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export async function writeAuditLog(
  supabase: SupabaseClient,
  input: AuditEventInput,
) {
  const { error } = await supabase.from("audit_logs").insert({
    tenant_id: input.tenantId,
    actor_user_id: input.actorUserId ?? null,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    action: input.action,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error("Unable to write audit log entry.");
  }
}

export async function listAuditLogs(
  supabase: SupabaseClient,
  tenantId: string,
  filters: {
    entityType?: string;
    action?: string;
  },
) {
  let query = supabase
    .from("audit_logs")
    .select("id, actor_user_id, entity_type, entity_id, action, metadata, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(150);

  if (filters.entityType) {
    query = query.eq("entity_type", filters.entityType);
  }

  if (filters.action) {
    query = query.eq("action", filters.action);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load audit logs.");
  }

  return ((data ?? []) as AuditLogRow[]).map(
    (row): AuditLogRecord => ({
      id: row.id,
      actorUserId: row.actor_user_id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      action: row.action,
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
    }),
  );
}
