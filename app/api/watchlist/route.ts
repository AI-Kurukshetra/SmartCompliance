import { NextResponse } from "next/server";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  listWatchlistResults,
  runWatchlistScreening,
} from "@/modules/watchlist/repository";
import {
  runWatchlistScreeningSchema,
  watchlistFiltersSchema,
} from "@/modules/watchlist/validation";

export async function GET(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 503 },
    );
  }

  const tenantContext = await getTenantContext();

  if (!tenantContext) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsedFilters = watchlistFiltersSchema.safeParse({
    verificationSessionId: url.searchParams.get("verificationSessionId") ?? undefined,
    provider: url.searchParams.get("provider") ?? undefined,
  });

  if (!parsedFilters.success) {
    return NextResponse.json(
      { error: parsedFilters.error.issues[0]?.message ?? "Invalid watchlist filters." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    const results = await listWatchlistResults(
      {
        supabase,
        tenantId: tenantContext.tenantId,
      },
      parsedFilters.data,
    );

    return NextResponse.json({
      data: results,
      meta: {
        count: results.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load watchlist results.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 503 },
    );
  }

  const tenantContext = await getTenantContext();

  if (!tenantContext) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!canManageTenant(tenantContext.role)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await request.json();
  const parsedBody = runWatchlistScreeningSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid screening payload." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    const result = await runWatchlistScreening(
      {
        supabase,
        tenantId: tenantContext.tenantId,
      },
      parsedBody.data,
    );

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to run watchlist screening.",
      },
      { status: 500 },
    );
  }
}
