import { NextResponse } from "next/server";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createRule, listRules } from "@/modules/rules/repository";
import { createRuleSchema, ruleFiltersSchema } from "@/modules/rules/validation";

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
  const parsedFilters = ruleFiltersSchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    enabled: url.searchParams.get("enabled") ?? undefined,
  });

  if (!parsedFilters.success) {
    return NextResponse.json(
      { error: parsedFilters.error.issues[0]?.message ?? "Invalid filters." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    const rules = await listRules(
      {
        supabase,
        tenantId: tenantContext.tenantId,
      },
      {
        query: parsedFilters.data.q,
        enabled: parsedFilters.data.enabled,
      },
    );

    return NextResponse.json({
      data: rules,
      meta: {
        count: rules.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load rules." },
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
  const parsedBody = createRuleSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid rule payload." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    const createdRule = await createRule(
      {
        supabase,
        tenantId: tenantContext.tenantId,
        actorUserId: tenantContext.userId,
      },
      parsedBody.data,
    );

    return NextResponse.json({ data: createdRule }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create rule." },
      { status: 500 },
    );
  }
}
