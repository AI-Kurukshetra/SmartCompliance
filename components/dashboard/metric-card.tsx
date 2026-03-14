import type { ComponentType, SVGProps } from "react";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
};

export function MetricCard({ label, value, detail, icon: Icon }: MetricCardProps) {
  return (
    <article className="panel rounded-[1.5rem] p-6">
      {Icon ? (
        <span className="inline-flex rounded-lg bg-ink p-2 text-shell">
          <Icon className="h-4 w-4" />
        </span>
      ) : null}
      <p className="text-xs uppercase tracking-[0.35em] text-ink/55">{label}</p>
      <p className="mt-4 font-[var(--font-display)] text-4xl text-ink">{value}</p>
      <p className="mt-3 text-sm leading-7 text-ink/70">{detail}</p>
    </article>
  );
}
