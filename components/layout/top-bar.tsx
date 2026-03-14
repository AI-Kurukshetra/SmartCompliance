import { logoutAction } from "@/app/actions/auth";
import { ShieldCheckIcon, UserBadgeIcon } from "@/components/ui/icons";
import { formatRoleLabel, type DashboardViewer } from "@/lib/auth-shared";

type TopBarProps = {
  preview?: boolean;
  viewer?: DashboardViewer | null;
};

export function TopBar({ preview = false, viewer = null }: TopBarProps) {
  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="panel flex flex-col gap-4 rounded-[1.8rem] px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-ink text-shell">
          <ShieldCheckIcon className="h-4 w-4" />
        </span>
        <div>
          <p className="app-kicker">Workspace</p>
          <p className="mt-1 text-lg font-semibold leading-tight text-ink">
            {preview
              ? "Preview dashboard"
              : `${viewer?.tenantName ?? "SmartCompliance"} operations`}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink/52">
            {viewer?.tenantSlug ? `${viewer.tenantSlug} • ` : ""}
            {todayLabel}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {preview ? (
          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
            Preview
          </span>
        ) : viewer ? (
          <div className="flex items-center gap-3 rounded-full border border-ink/12 bg-white/86 px-2 py-2 pr-3 text-ink shadow-[0_8px_24px_rgba(21,31,48,0.1)]">
            <span className="inline-flex rounded-full bg-ink p-2 text-shell">
              <UserBadgeIcon className="h-4 w-4" />
            </span>
            <div className="text-right">
              <p className="max-w-[18ch] truncate text-sm font-semibold">
                {viewer.fullName ?? viewer.email}
              </p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-ink/48">
                {formatRoleLabel(viewer.role)}
              </p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="btn-secondary px-3 py-1.5 text-[10px]"
              >
                Sign out
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </header>
  );
}
