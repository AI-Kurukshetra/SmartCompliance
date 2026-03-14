import Image from "next/image";
import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { ArrowRightIcon } from "@/components/ui/icons";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type WorkflowFact = {
  label: string;
  value: string;
  detail?: string;
};

type WorkflowNotice = {
  tone: "info" | "warning";
  message: string;
};

type WorkflowStep = {
  title: string;
  detail: string;
  icon?: IconComponent;
};

type WorkflowLink = {
  href: string;
  label: string;
};

type WorkflowVisual = {
  alt: string;
  src: string;
};

type WorkflowShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: IconComponent;
  backHref: string;
  backLabel: string;
  formTitle: string;
  formDescription: string;
  facts: WorkflowFact[];
  notices?: WorkflowNotice[];
  railEyebrow: string;
  railTitle: string;
  railDescription: string;
  steps: WorkflowStep[];
  railLink?: WorkflowLink;
  visual?: WorkflowVisual;
  children: ReactNode;
};

function noticeClassName(tone: WorkflowNotice["tone"]) {
  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-sky-200 bg-sky-50 text-sky-800";
}

export function WorkflowShell({
  eyebrow,
  title,
  description,
  icon: Icon,
  backHref,
  backLabel,
  formTitle,
  formDescription,
  facts,
  notices = [],
  railEyebrow,
  railTitle,
  railDescription,
  steps,
  railLink,
  visual,
  children,
}: WorkflowShellProps) {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <article className="panel relative overflow-hidden rounded-[2rem] p-6 md:p-8">
          <div className="shine-line absolute inset-x-6 top-0 h-px opacity-80" />
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-signal/18 blur-3xl" />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <span className="inline-flex rounded-2xl bg-ink p-3 text-shell shadow-[0_18px_38px_rgba(21,31,48,0.22)]">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="app-kicker">{eyebrow}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-ink/48">
                    Workflow briefing
                  </p>
                </div>
              </div>
              <h1 className="mt-5 font-[var(--font-display)] text-4xl leading-[0.96] text-ink md:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/72 md:text-[15px]">
                {description}
              </p>
            </div>

            <Link
              href={backHref}
              className="btn-secondary w-full justify-center px-4 py-2 text-[11px] sm:w-auto"
            >
              {backLabel}
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {facts.map((fact) => (
              <article
                key={fact.label}
                className="rounded-[1.35rem] border border-ink/10 bg-white/88 px-4 py-4 shadow-[0_12px_28px_rgba(21,31,48,0.08)]"
              >
                <p className="app-kicker">{fact.label}</p>
                <p className="mt-2 font-[var(--font-display)] text-[1.9rem] leading-none text-ink">
                  {fact.value}
                </p>
                {fact.detail ? (
                  <p className="mt-2 text-xs leading-5 text-ink/58">{fact.detail}</p>
                ) : null}
              </article>
            ))}
          </div>
        </article>

        <article className="panel-strong relative overflow-hidden rounded-[2rem] p-5 md:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/55 to-transparent" />
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="app-kicker">{formTitle}</p>
                <h2 className="mt-2 font-[var(--font-display)] text-[2rem] leading-tight text-ink md:text-[2.25rem]">
                  Operator input
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-ink/68">
                  {formDescription}
                </p>
              </div>
              <span className="rounded-full border border-ink/12 bg-white/86 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/52">
                Structured form
              </span>
            </div>

            {notices.length > 0 ? (
              <div className="mt-5 space-y-3">
                {notices.map((notice) => (
                  <p
                    key={`${notice.tone}-${notice.message}`}
                    className={`rounded-[1.1rem] border px-4 py-3 text-sm leading-6 ${noticeClassName(
                      notice.tone,
                    )}`}
                  >
                    {notice.message}
                  </p>
                ))}
              </div>
            ) : null}

            <div className="mt-6">{children}</div>
          </div>
        </article>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
        {visual ? (
          <div className="panel-strong rounded-[1.8rem] p-4">
            <Image
              src={visual.src}
              alt={visual.alt}
              width={1280}
              height={960}
              className="h-auto w-full rounded-[1.35rem] border border-ink/10"
            />
          </div>
        ) : (
          <div className="panel-strong relative overflow-hidden rounded-[1.8rem] p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(188,255,98,0.35),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(203,125,79,0.2),transparent_36%)]" />
            <div className="absolute inset-4 rounded-[1.4rem] border border-ink/10 bg-white/65" />
            <div className="relative grid gap-3">
              <div className="rounded-[1.2rem] border border-ink/10 bg-ink px-4 py-4 text-shell">
                <p className="text-[11px] uppercase tracking-[0.28em] text-shell/68">
                  Workflow lane
                </p>
                <p className="mt-2 font-[var(--font-display)] text-3xl leading-none">
                  Guided
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-[1rem] border border-ink/10 bg-white/90 px-3 py-4 text-center">
                  <p className="app-kicker">Intake</p>
                  <p className="mt-2 text-sm font-semibold text-ink">01</p>
                </div>
                <div className="rounded-[1rem] border border-ink/10 bg-white/90 px-3 py-4 text-center">
                  <p className="app-kicker">Review</p>
                  <p className="mt-2 text-sm font-semibold text-ink">02</p>
                </div>
                <div className="rounded-[1rem] border border-ink/10 bg-white/90 px-3 py-4 text-center">
                  <p className="app-kicker">Output</p>
                  <p className="mt-2 text-sm font-semibold text-ink">03</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="panel rounded-[1.8rem] p-5">
          <p className="app-kicker">{railEyebrow}</p>
          <h3 className="mt-2 font-[var(--font-display)] text-[2rem] leading-[0.95] text-ink">
            {railTitle}
          </h3>
          <p className="mt-3 text-sm leading-7 text-ink/68">{railDescription}</p>

          <div className="mt-5 space-y-3">
            {steps.map((step, index) => {
              const StepIcon = step.icon;

              return (
                <article
                  key={step.title}
                  className="rounded-[1.2rem] border border-ink/10 bg-white/86 px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border border-ink/10 bg-shell text-ink">
                      {StepIcon ? (
                        <StepIcon className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-semibold">{index + 1}</span>
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{step.title}</p>
                      <p className="mt-1 text-xs leading-5 text-ink/58">{step.detail}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {railLink ? (
            <Link
              href={railLink.href}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-ink transition hover:text-ink/72"
            >
              {railLink.label}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </aside>
    </section>
  );
}
