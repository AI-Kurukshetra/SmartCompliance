import Image from "next/image";
import Link from "next/link";
import {
  ActivityIcon,
  FileChartIcon,
  ListChecksIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";

const highlights = [
  {
    icon: ShieldCheckIcon,
    title: "Identity Verification",
    detail:
      "Capture onboarding data, document metadata, and confidence scores in one tenant-safe flow.",
  },
  {
    icon: ListChecksIcon,
    title: "Screening + Decisioning",
    detail:
      "Run watchlist checks, evaluate risk rules, and auto-route to approve, reject, or manual review.",
  },
  {
    icon: FileChartIcon,
    title: "Operations + Reporting",
    detail:
      "Case queues, transaction monitoring, audit trail, and SAR/CTR report generation from one console.",
  },
];

const stats = [
  { label: "Workflow modules", value: "10 phases", icon: ListChecksIcon },
  { label: "Tenant isolation", value: "RLS-first", icon: ShieldCheckIcon },
  { label: "Regulatory output", value: "SAR + CTR", icon: ActivityIcon },
];

const workflowSteps = [
  {
    title: "Capture",
    detail: "Create customer and ingest KYC profile details in one structured flow.",
  },
  {
    title: "Assess",
    detail: "Run verification, screening, and dynamic risk scoring using shared context.",
  },
  {
    title: "Act",
    detail: "Escalate to cases, monitor alerts, and generate regulator-ready outputs.",
  },
];

export default function HomePage() {
  return (
    <main className="shell-grid relative min-h-screen overflow-hidden px-4 py-6 md:px-8 md:py-8 lg:px-12">
      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-[#d3f4ef] blur-3xl float-slow" />
      <div className="pointer-events-none absolute -left-20 bottom-20 h-80 w-80 rounded-full bg-[#ffe8cb] blur-3xl float-delay" />

      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="panel flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-xs font-bold text-shell">
              SC
            </span>
            <div>
              <p className="app-kicker">SmartCompliance</p>
              <p className="text-xs text-ink/58">Financial crime operations platform</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="btn-secondary px-4 py-2 text-[11px]"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="btn-primary px-4 py-2 text-[11px]"
            >
              Start workspace
            </Link>
          </nav>
        </header>

        <section className="panel relative overflow-hidden rounded-[2rem] p-6 md:p-10">
          <div className="shine-line absolute inset-x-6 top-0 h-px opacity-80" />
          <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-7">
              <div className="inline-flex rounded-full border border-ink/12 bg-white/90 px-4 py-1.5 text-xs uppercase tracking-[0.28em] text-ink/62">
                KYC • AML • Case Management
              </div>
              <h1 className="font-[var(--font-display)] text-5xl leading-[0.92] text-balance text-ink md:text-7xl">
                A clearer way to run compliance operations.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-ink/72 md:text-lg">
                SmartCompliance gives fintech teams a single control plane for
                verification, watchlist screening, risk scoring, transaction
                monitoring, case reviews, and regulatory reporting.
              </p>

              <div className="grid gap-3 sm:grid-cols-2 md:max-w-2xl">
                <Link
                  href="/signup"
                  className="rounded-[1.2rem] border border-ink/20 bg-ink px-5 py-4 text-shell transition hover:-translate-y-0.5 hover:bg-ink/92"
                >
                  <p className="text-xs uppercase tracking-[0.28em] text-shell/72">
                    Step 1
                  </p>
                  <p className="mt-2 text-lg font-semibold">Create account</p>
                  <p className="mt-2 text-sm text-shell/80">
                    Provision tenant and admin in one flow.
                  </p>
                </Link>
                <Link
                  href="/login"
                  className="rounded-[1.2rem] border border-ink/16 bg-white/90 px-5 py-4 transition hover:-translate-y-0.5 hover:border-ink/30"
                >
                  <p className="text-xs uppercase tracking-[0.28em] text-ink/55">
                    Returning team
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">Open dashboard</p>
                  <p className="mt-2 text-sm text-ink/65">
                    Continue customer, case, and report workflows.
                  </p>
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {stats.map((stat) => (
                  <article
                    key={stat.label}
                    className="rounded-[1rem] border border-ink/12 bg-white/88 px-4 py-3"
                  >
                    <stat.icon className="h-4 w-4 text-ink/55" />
                    <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-ink/52">
                      {stat.label}
                    </p>
                    <p className="mt-1.5 text-sm font-semibold text-ink">{stat.value}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="panel-strong rounded-[1.7rem] p-4 md:p-5">
              <div className="rounded-[1.2rem] border border-ink/10 bg-white p-2 shadow-[0_18px_42px_rgba(23,32,51,0.1)]">
                <Image
                  src="/landing-compliance-visual.svg"
                  alt="Compliance control tower with verification, risk decisioning, and audit workflow"
                  width={1280}
                  height={960}
                  className="h-auto w-full rounded-[1rem]"
                  priority
                />
              </div>
              <div className="mt-4 space-y-2 rounded-[1rem] border border-ink/10 bg-shell/85 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-ink/58">
                  Tenant-aware workflow from onboarding to reporting.
                </p>
                {workflowSteps.map((step) => (
                  <p key={step.title} className="text-sm leading-6 text-ink/72">
                    <span className="font-semibold text-ink">{step.title}:</span>{" "}
                    {step.detail}
                  </p>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article key={item.title} className="panel rounded-[1.4rem] p-6">
              <span className="inline-flex rounded-lg bg-ink p-2 text-shell">
                <item.icon className="h-4 w-4" />
              </span>
              <p className="app-kicker mt-3">Capability</p>
              <h2 className="mt-3 font-[var(--font-display)] text-[1.9rem] leading-tight text-ink">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-ink/70">{item.detail}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
