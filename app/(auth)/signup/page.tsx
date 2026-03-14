import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { BuildingIcon, ShieldCheckIcon, UsersIcon } from "@/components/ui/icons";
import { getAuthState } from "@/lib/auth";
import { hasAdminSupabaseEnv, hasSupabaseEnv } from "@/lib/env";

export const metadata = {
  title: "Sign Up | SmartCompliance",
};

export default async function SignupPage() {
  const authState = await getAuthState();

  if (authState.viewer) {
    redirect("/dashboard");
  }

  const isAuthEnabled = hasSupabaseEnv();
  const isAdminEnabled = hasAdminSupabaseEnv();

  return (
    <main className="shell-grid min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1fr]">
        <aside className="panel-strong rounded-[2rem] p-4 md:p-5">
          <Image
            src="/landing-compliance-visual.svg"
            alt="Compliance product illustration"
            width={1280}
            height={960}
            className="h-auto w-full rounded-[1.2rem]"
            priority
          />
          <div className="mt-4 grid gap-2">
            <p className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white/85 px-3 py-2 text-sm text-ink/70">
              <BuildingIcon className="h-4 w-4 text-ink/55" />
              New workspace and tenant are provisioned together.
            </p>
            <p className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white/85 px-3 py-2 text-sm text-ink/70">
              <ShieldCheckIcon className="h-4 w-4 text-ink/55" />
              Security and audit boundaries are tenant-isolated by default.
            </p>
          </div>
        </aside>

        <section className="panel rounded-[2rem] p-7 md:p-9">
          <div className="flex items-center gap-3">
            <span className="inline-flex rounded-xl bg-ink p-2 text-shell">
              <UsersIcon />
            </span>
            <p className="app-kicker">Workspace onboarding</p>
          </div>
          <h1 className="mt-4 font-[var(--font-display)] text-5xl leading-[0.95] text-ink">
            Create workspace
          </h1>
          <p className="mt-3 text-sm leading-7 text-ink/70">
            Provision tenant and first admin account in one flow.
          </p>

          {!isAuthEnabled ? (
            <p className="mt-5 rounded-[1.2rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              Supabase env is missing. Workspace creation is disabled.
            </p>
          ) : null}
          {isAuthEnabled && !isAdminEnabled ? (
            <p className="mt-4 rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              `SUPABASE_SERVICE_ROLE_KEY` is required for tenant provisioning.
            </p>
          ) : null}

          <div className="mt-6">
            <SignupForm disabled={!(isAuthEnabled && isAdminEnabled)} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/"
              className="btn-secondary px-4 py-2 text-[11px]"
            >
              Back
            </Link>
            <Link
              href="/login"
              className="btn-primary px-4 py-2 text-[11px]"
            >
              Login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
