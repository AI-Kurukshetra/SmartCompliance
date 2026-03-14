type FeaturePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
};

export function FeaturePage({
  eyebrow,
  title,
  description,
  highlights,
}: FeaturePageProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <article className="panel rounded-[2rem] p-8">
        <p className="text-sm uppercase tracking-[0.35em] text-ink/55">
          {eyebrow}
        </p>
        <h1 className="mt-4 font-[var(--font-display)] text-5xl leading-tight text-ink">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-ink/72">
          {description}
        </p>
      </article>
      <aside className="panel-strong rounded-[2rem] p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-ink/55">
          Planned highlights
        </p>
        <ul className="mt-5 space-y-3 text-sm leading-7 text-ink/72">
          {highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      </aside>
    </section>
  );
}

