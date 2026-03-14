import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { LockIcon, ShieldCheckIcon, SparklesIcon } from "@/components/ui/icons";
import { getAuthState } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";

export const metadata = {
  title: "Login | SmartCompliance",
};

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function resolveReasonMessage(reason?: string) {
  if (reason === "account") {
    return "Your session is active but tenant profile is missing. Sign in after provisioning.";
  }

  if (reason === "auth-required") {
    return "Sign in to access the SmartCompliance workspace.";
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const authState = await getAuthState();

  if (authState.viewer) {
    redirect("/dashboard");
  }

  const params = searchParams ? await searchParams : {};
  const reasonParam = params.reason;
  const reason =
    typeof reasonParam === "string" ? reasonParam : reasonParam?.[0];
  const reasonMessage = resolveReasonMessage(reason);
  const isAuthEnabled = hasSupabaseEnv();

  return (
    <main className="shell-grid min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="panel rounded-[2rem] p-7 md:p-9">
          <div className="flex items-center gap-3">
            <span className="inline-flex rounded-xl bg-ink p-2 text-shell">
              <ShieldCheckIcon />
            </span>
            <p className="app-kicker">Secure access</p>
          </div>
          <h1 className="mt-4 font-[var(--font-display)] text-5xl leading-[0.95] text-ink">
            Sign in
          </h1>
          <p className="mt-3 text-sm leading-7 text-ink/70">
            Access customers, verifications, cases, monitoring, and reporting.
          </p>

          {reasonMessage ? (
            <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {reasonMessage}
            </p>
          ) : null}
          {!isAuthEnabled ? (
            <p className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              Supabase environment variables are missing. Auth is in preview mode.
            </p>
          ) : null}

          <div className="mt-6">
            <LoginForm disabled={!isAuthEnabled} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/"
              className="btn-secondary px-4 py-2 text-[11px]"
            >
              Back
            </Link>
            <Link
              href="/signup"
              className="btn-primary px-4 py-2 text-[11px]"
            >
              Create workspace
            </Link>
          </div>
        </section>

        <aside className="panel-strong rounded-[2rem] p-4 md:p-5">
          <Image
            src="/compliance-grid-visual.svg"
            alt="Compliance workflow illustration"
            width={1280}
            height={720}
            className="h-auto w-full rounded-[1.2rem]"
            priority
          />
          <div className="mt-4 grid gap-2">
            <p className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white/85 px-3 py-2 text-sm text-ink/70">
              <LockIcon className="h-4 w-4 text-ink/55" />
              Tenant-scoped sessions with role-based access.
            </p>
            <p className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white/85 px-3 py-2 text-sm text-ink/70">
              <SparklesIcon className="h-4 w-4 text-ink/55" />
              Resume customer, verification, and reporting workflows instantly.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
