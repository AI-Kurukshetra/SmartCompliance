import { NextResponse } from "next/server";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  getCustomerById,
  updateCustomer,
} from "@/modules/customers/repository";
import { updateCustomerSchema } from "@/modules/customers/validation";

type CustomerParams = {
  params: Promise<{
    customerId: string;
  }>;
};

export async function GET(_request: Request, context: CustomerParams) {
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

  const { customerId } = await context.params;
  const supabase = await createClient();

  try {
    const customer = await getCustomerById(
      {
        supabase,
        tenantId: tenantContext.tenantId,
      },
      customerId,
    );

    return NextResponse.json({ data: customer });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load customer.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: CustomerParams) {
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

  const { customerId } = await context.params;
  const body = await request.json();
  const parsedBody = updateCustomerSchema.safeParse({
    customerId,
    ...body,
  });

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid customer payload." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    const customer = await updateCustomer(
      {
        supabase,
        tenantId: tenantContext.tenantId,
      },
      parsedBody.data.customerId,
      parsedBody.data,
    );

    return NextResponse.json({ data: customer });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update the customer.",
      },
      { status: 500 },
    );
  }
}
