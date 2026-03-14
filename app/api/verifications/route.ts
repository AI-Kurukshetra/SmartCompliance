import { NextResponse } from "next/server";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  createVerificationSession,
  listVerificationSessions,
} from "@/modules/verifications/repository";
import {
  createVerificationSessionSchema,
  verificationFiltersSchema,
} from "@/modules/verifications/validation";

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
  const parsedFilters = verificationFiltersSchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  });

  if (!parsedFilters.success) {
    return NextResponse.json(
      { error: parsedFilters.error.issues[0]?.message ?? "Invalid filter values." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    const sessions = await listVerificationSessions(
      {
        supabase,
        tenantId: tenantContext.tenantId,
      },
      {
        query: parsedFilters.data.q,
        status: parsedFilters.data.status,
      },
    );

    return NextResponse.json({
      data: sessions,
      meta: {
        count: sessions.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load verification sessions.",
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
  const parsedBody = createVerificationSessionSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid session payload." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    const session = await createVerificationSession(
      {
        supabase,
        tenantId: tenantContext.tenantId,
      },
      parsedBody.data,
    );

    return NextResponse.json({ data: session }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create verification session.",
      },
      { status: 500 },
    );
  }
}
