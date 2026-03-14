import { NextResponse } from "next/server";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { updateCase } from "@/modules/cases/repository";
import { updateCaseSchema } from "@/modules/cases/validation";

type CaseParams = {
  params: Promise<{
    caseId: string;
  }>;
};

export async function PATCH(request: Request, context: CaseParams) {
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

  const { caseId } = await context.params;

  if (!caseId) {
    return NextResponse.json({ error: "caseId is required." }, { status: 400 });
  }

  const body = await request.json();
  const parsedBody = updateCaseSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid case update payload." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    const updatedCase = await updateCase(
      {
        supabase,
        tenantId: tenantContext.tenantId,
        actorUserId: tenantContext.userId,
      },
      caseId,
      parsedBody.data,
    );

    return NextResponse.json({ data: updatedCase });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update case.",
      },
      { status: 500 },
    );
  }
}
