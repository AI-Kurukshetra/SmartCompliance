import { NextResponse } from "next/server";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createCustomer, listCustomers } from "@/modules/customers/repository";
import {
  createCustomerSchema,
  customerFiltersSchema,
} from "@/modules/customers/validation";

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
  const parsedFilters = customerFiltersSchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    risk: url.searchParams.get("risk") ?? undefined,
  });

  if (!parsedFilters.success) {
    return NextResponse.json(
      { error: parsedFilters.error.issues[0]?.message ?? "Invalid filter values." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    const customers = await listCustomers(
      {
        supabase,
        tenantId: tenantContext.tenantId,
      },
      {
        query: parsedFilters.data.q,
        risk: parsedFilters.data.risk,
      },
    );

    return NextResponse.json({
      data: customers,
      meta: {
        count: customers.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to load customers.",
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
  const parsedBody = createCustomerSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid customer payload." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  try {
    const customer = await createCustomer(
      {
        supabase,
        tenantId: tenantContext.tenantId,
      },
      parsedBody.data,
    );

    return NextResponse.json({ data: customer }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create the customer.",
      },
      { status: 500 },
    );
  }
}
