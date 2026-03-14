import { NextResponse } from "next/server";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  ingestTransaction,
  listTransactions,
} from "@/modules/transactions/repository";
import {
  ingestTransactionSchema,
  transactionFiltersSchema,
} from "@/modules/transactions/validation";

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
  const parsedFilters = transactionFiltersSchema.safeParse({
    status: url.searchParams.get("status") ?? undefined,
    customerId: url.searchParams.get("customerId") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  });

  if (!parsedFilters.success) {
    return NextResponse.json(
      { error: parsedFilters.error.issues[0]?.message ?? "Invalid filter values." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    const transactions = await listTransactions(
      {
        supabase,
        tenantId: tenantContext.tenantId,
      },
      {
        status: parsedFilters.data.status,
        customerId: parsedFilters.data.customerId,
        query: parsedFilters.data.q,
      },
    );

    return NextResponse.json({
      data: transactions,
      meta: {
        count: transactions.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to load transactions.",
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
  const parsedBody = ingestTransactionSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error:
          parsedBody.error.issues[0]?.message ?? "Invalid transaction payload.",
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    const result = await ingestTransaction(
      {
        supabase,
        tenantId: tenantContext.tenantId,
        actorUserId: tenantContext.userId,
      },
      parsedBody.data,
    );

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to ingest transaction.",
      },
      { status: 500 },
    );
  }
}
