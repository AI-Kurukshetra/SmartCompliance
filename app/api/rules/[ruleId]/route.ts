import { NextResponse } from "next/server";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getRuleById, updateRule } from "@/modules/rules/repository";
import { patchRuleSchema } from "@/modules/rules/validation";

type RuleParams = {
  params: Promise<{
    ruleId: string;
  }>;
};

export async function GET(_request: Request, context: RuleParams) {
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

  const { ruleId } = await context.params;
  if (!ruleId) {
    return NextResponse.json({ error: "ruleId is required." }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    const rule = await getRuleById(
      {
        supabase,
        tenantId: tenantContext.tenantId,
      },
      ruleId,
    );

    return NextResponse.json({ data: rule });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load rule." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RuleParams) {
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

  const { ruleId } = await context.params;
  if (!ruleId) {
    return NextResponse.json({ error: "ruleId is required." }, { status: 400 });
  }

  const body = await request.json();
  const parsedBody = patchRuleSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid rule update payload." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    const updatedRule = await updateRule(
      {
        supabase,
        tenantId: tenantContext.tenantId,
        actorUserId: tenantContext.userId,
      },
      ruleId,
      parsedBody.data,
    );

    return NextResponse.json({ data: updatedRule });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update rule." },
      { status: 500 },
    );
  }
}
