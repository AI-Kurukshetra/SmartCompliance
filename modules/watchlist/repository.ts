import type { SupabaseClient } from "@supabase/supabase-js";
import { runProviderPlaceholder } from "@/modules/watchlist/providers";
import type {
  RunScreeningInput,
  WatchlistFilters,
  WatchlistResultRecord,
} from "@/modules/watchlist/types";

type WatchlistResultRow = {
  id: string;
  verification_session_id: string;
  provider: "ofac_placeholder" | "pep_placeholder" | "sanctions_placeholder";
  status: "clear" | "possible_match" | "confirmed_match" | "manual_review";
  match_score: number | null;
  match_details: Record<string, unknown> | null;
  created_at: string;
};

type WatchlistRepositoryParams = {
  supabase: SupabaseClient;
  tenantId: string;
};

type SessionContextRow = {
  id: string;
  customer_id: string;
};

type CustomerContextRow = {
  first_name: string;
  last_name: string;
};

function mapWatchlistResult(row: WatchlistResultRow): WatchlistResultRecord {
  return {
    id: row.id,
    verificationSessionId: row.verification_session_id,
    provider: row.provider,
    status: row.status,
    matchScore: row.match_score,
    matchDetails: row.match_details ?? {},
    createdAt: row.created_at,
  };
}

export async function listWatchlistResults(
  { supabase, tenantId }: WatchlistRepositoryParams,
  filters: WatchlistFilters,
) {
  let query = supabase
    .from("watchlist_results")
    .select(
      "id, verification_session_id, provider, status, match_score, match_details, created_at",
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(60);

  if (filters.verificationSessionId) {
    query = query.eq("verification_session_id", filters.verificationSessionId);
  }

  if (filters.provider) {
    query = query.eq("provider", filters.provider);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load watchlist screening results.");
  }

  return ((data ?? []) as WatchlistResultRow[]).map((row) =>
    mapWatchlistResult(row),
  );
}

export async function runWatchlistScreening(
  { supabase, tenantId }: WatchlistRepositoryParams,
  input: RunScreeningInput,
) {
  const { data: session, error: sessionError } = await supabase
    .from("verification_sessions")
    .select("id, customer_id")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .eq("id", input.verificationSessionId)
    .maybeSingle();

  if (sessionError || !session) {
    throw new Error("Verification session was not found for screening.");
  }

  const sessionContext = session as SessionContextRow;

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("first_name, last_name")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .eq("id", sessionContext.customer_id)
    .maybeSingle();

  if (customerError || !customer) {
    throw new Error("Linked customer was not found for screening.");
  }

  const customerContext = customer as CustomerContextRow;
  const fullName = `${customerContext.first_name} ${customerContext.last_name}`.trim();
  const screening = runProviderPlaceholder({
    provider: input.provider,
    fullName,
  });

  const { data: insertedResult, error: insertError } = await supabase
    .from("watchlist_results")
    .insert({
      tenant_id: tenantId,
      verification_session_id: input.verificationSessionId,
      provider: input.provider,
      status: screening.status,
      match_score: screening.score,
      match_details: screening.details,
    })
    .select(
      "id, verification_session_id, provider, status, match_score, match_details, created_at",
    )
    .single();

  if (insertError || !insertedResult) {
    throw new Error("Unable to persist watchlist screening result.");
  }

  if (screening.status === "clear") {
    await supabase
      .from("verification_sessions")
      .update({
        status: "screening",
      })
      .eq("tenant_id", tenantId)
      .eq("id", input.verificationSessionId);
  } else {
    await supabase
      .from("verification_sessions")
      .update({
        status: "review",
      })
      .eq("tenant_id", tenantId)
      .eq("id", input.verificationSessionId);
  }

  return mapWatchlistResult(insertedResult as WatchlistResultRow);
}
