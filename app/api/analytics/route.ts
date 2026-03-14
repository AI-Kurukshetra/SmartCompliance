import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getAnalyticsOverview } from "@/modules/analytics/repository";

export async function GET() {
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

  const supabase = await createClient();

  try {
    const overview = await getAnalyticsOverview({
      supabase,
      tenantId: tenantContext.tenantId,
    });

    return NextResponse.json({ data: overview });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to load analytics.",
      },
      { status: 500 },
    );
  }
}
