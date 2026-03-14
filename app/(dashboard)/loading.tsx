import { BrandLoader } from "@/components/ui/brand-loader";

export default function DashboardLoading() {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className="space-y-6"
    >
      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="skeleton-wash h-3 w-28 rounded-full" />
            <div className="skeleton-wash h-12 w-full max-w-[20rem] rounded-[1rem]" />
            <div className="skeleton-wash h-4 w-full max-w-[34rem] rounded-full" />
            <div className="skeleton-wash h-4 w-full max-w-[26rem] rounded-full" />
          </div>
          <div className="inline-flex items-center gap-3 rounded-full border border-ink/12 bg-white/82 px-4 py-2">
            <BrandLoader compact />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/56">
              Loading section
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[1.35rem] border border-ink/10 bg-white/88 p-4"
            >
              <div className="skeleton-wash h-3 w-24 rounded-full" />
              <div className="mt-3 skeleton-wash h-10 w-24 rounded-[0.8rem]" />
              <div className="mt-3 skeleton-wash h-3 w-full rounded-full" />
            </div>
          ))}
        </div>
      </article>

      <article className="panel-strong rounded-[2rem] p-5 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4">
            <div className="skeleton-wash h-3 w-32 rounded-full" />
            <div className="skeleton-wash h-10 w-full max-w-[18rem] rounded-[0.9rem]" />
            <div className="skeleton-wash h-4 w-full rounded-full" />
            <div className="skeleton-wash h-4 w-full max-w-[82%] rounded-full" />
            <div className="rounded-[1.5rem] border border-ink/10 bg-white/86 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="skeleton-wash h-3 w-24 rounded-full" />
                    <div className="skeleton-wash h-11 w-full rounded-[1rem]" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[1.5rem] border border-ink/10 bg-white/86 p-4">
              <div className="skeleton-wash aspect-[5/4] w-full rounded-[1.2rem]" />
            </div>
            <div className="rounded-[1.5rem] border border-ink/10 bg-white/86 p-4">
              <div className="skeleton-wash h-3 w-24 rounded-full" />
              <div className="mt-3 space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-[1rem] border border-ink/10 bg-shell/70 p-4"
                  >
                    <div className="skeleton-wash h-3 w-28 rounded-full" />
                    <div className="mt-2 skeleton-wash h-3 w-full rounded-full" />
                    <div className="mt-2 skeleton-wash h-3 w-[78%] rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </article>
    </section>
  );
}
