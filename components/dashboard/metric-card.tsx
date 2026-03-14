import type { ComponentType, SVGProps } from "react";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
};

export function MetricCard({ label, value, detail, icon: Icon }: MetricCardProps) {
  return (
    <article className="panel rounded-[1.45rem] p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="app-kicker">{label}</p>
        {Icon ? (
          <span className="inline-flex rounded-xl border border-ink/12 bg-ink p-2 text-shell shadow-[0_10px_26px_rgba(21,31,48,0.25)]">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-4 font-[var(--font-display)] text-4xl leading-none text-ink md:text-[2.6rem]">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-ink/70">{detail}</p>
    </article>
  );
}
