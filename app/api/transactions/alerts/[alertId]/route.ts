import { NextResponse } from "next/server";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { updateAlertStatus } from "@/modules/transactions/repository";
import { updateAlertStatusSchema } from "@/modules/transactions/validation";

type AlertParams = {
  params: Promise<{
    alertId: string;
  }>;
};

export async function PATCH(request: Request, context: AlertParams) {
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

  const { alertId } = await context.params;

  if (!alertId) {
    return NextResponse.json({ error: "alertId is required." }, { status: 400 });
  }

  const body = await request.json();
  const parsedBody = updateAlertStatusSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error:
          parsedBody.error.issues[0]?.message ?? "Invalid alert status payload.",
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    const updatedAlert = await updateAlertStatus(
      {
        supabase,
        tenantId: tenantContext.tenantId,
        actorUserId: tenantContext.userId,
      },
      alertId,
      parsedBody.data.status,
    );

    return NextResponse.json({ data: updatedAlert });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update alert status.",
      },
      { status: 500 },
    );
  }
}
