import { logoutAction } from "@/app/actions/auth";
import { ShieldCheckIcon, UserBadgeIcon } from "@/components/ui/icons";
import { formatRoleLabel, type DashboardViewer } from "@/lib/auth-shared";

type TopBarProps = {
  preview?: boolean;
  viewer?: DashboardViewer | null;
};

export function TopBar({ preview = false, viewer = null }: TopBarProps) {
  return (
    <header className="panel flex flex-col gap-4 rounded-[2rem] px-6 py-5 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-ink/55">
          <ShieldCheckIcon className="h-4 w-4" />
          Workspace
        </p>
        <p className="mt-1 text-lg font-semibold text-ink">
          {preview
            ? "Preview dashboard"
            : `${viewer?.tenantName ?? "SmartCompliance"} operations`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {preview ? (
          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            Preview
          </span>
        ) : viewer ? (
          <div className="flex items-center gap-3 rounded-full border border-ink/10 bg-white/80 px-3 py-2 normal-case tracking-normal text-ink">
            <span className="inline-flex rounded-full bg-ink p-2 text-shell">
              <UserBadgeIcon className="h-4 w-4" />
            </span>
            <div className="text-right">
              <p className="text-sm font-semibold">
                {viewer.fullName ?? viewer.email}
              </p>
              <p className="text-xs uppercase tracking-[0.25em] text-ink/45">
                {formatRoleLabel(viewer.role)}
              </p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full border border-ink/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-ink transition hover:border-ink/30 hover:bg-shell"
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
