import { NextResponse } from "next/server";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { listRiskProfiles, runRiskDecisionEngine } from "@/modules/risk/repository";
import { runRiskDecisionSchema } from "@/modules/risk/validation";

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
  const verificationSessionId =
    url.searchParams.get("verificationSessionId") ?? undefined;

  if (
    verificationSessionId &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      verificationSessionId,
    )
  ) {
    return NextResponse.json(
      { error: "verificationSessionId must be a valid UUID." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    const profiles = await listRiskProfiles(
      {
        supabase,
        tenantId: tenantContext.tenantId,
      },
      {
        verificationSessionId,
      },
    );

    return NextResponse.json({
      data: profiles,
      meta: {
        count: profiles.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to load risk profiles.",
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
  const parsedBody = runRiskDecisionSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid risk payload." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    const result = await runRiskDecisionEngine(
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
            : "Unable to run risk decision engine.",
      },
      { status: 500 },
    );
  }
}
