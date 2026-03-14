"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ActivityIcon,
  CogIcon,
  FileChartIcon,
  HomeIcon,
  ListChecksIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
} from "@/components/ui/icons";
import {
  canManageTenant,
  formatRoleLabel,
  type DashboardViewer,
} from "@/lib/auth-shared";
import { DASHBOARD_NAV } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SideNavProps = {
  preview?: boolean;
  viewer?: DashboardViewer | null;
};

export function SideNav({ preview = false, viewer = null }: SideNavProps) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const canManage = viewer ? canManageTenant(viewer.role) : false;
  const iconMap = {
    home: HomeIcon,
    users: UsersIcon,
    checks: ListChecksIcon,
    activity: ActivityIcon,
    pulse: ShieldCheckIcon,
    cog: CogIcon,
    report: FileChartIcon,
    settings: SparklesIcon,
  } as const;

  const primaryLinks = DASHBOARD_NAV.slice(0, 5);
  const supportLinks = DASHBOARD_NAV.slice(5);
  const navSurfaceClassName =
    "mt-2 w-full rounded-[1.25rem] border border-ink/10 bg-white/72 p-2.5 shadow-[0_12px_30px_rgba(21,31,48,0.08),inset_0_1px_0_rgba(255,255,255,0.78)]";

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  function renderNavLinks(
    links: ReadonlyArray<(typeof DASHBOARD_NAV)[number]>,
  ) {
    return (
      <div className="grid gap-2">
        {links.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const isPending = pendingHref === item.href;
          const Icon = iconMap[item.icon];

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              onClick={() => {
                if (!isActive) {
                  setPendingHref(item.href);
                }
              }}
              className={cn(
                "group relative flex min-h-[3.55rem] items-center justify-between overflow-hidden rounded-[1rem] border px-3.5 py-3 text-sm font-semibold transition",
                isActive
                  ? "border-ink/70 bg-ink text-shell shadow-[0_14px_28px_rgba(21,31,48,0.26)]"
                  : "border-ink/10 bg-white text-ink/78 shadow-[0_8px_20px_rgba(21,31,48,0.06)] hover:border-ink/25 hover:bg-white",
                isPending && !isActive
                  ? "border-ink/35 bg-white text-ink shadow-[0_10px_24px_rgba(21,31,48,0.1)]"
                  : null,
              )}
            >
              {isPending && !isActive ? (
                <span
                  aria-hidden="true"
                  className="nav-link-progress absolute inset-x-3 bottom-0 h-1 rounded-full"
                />
              ) : null}

              <span className="relative z-[1] flex items-center gap-2.5">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              <span
                className={cn(
                  "relative z-[1] text-[10px] uppercase tracking-[0.18em]",
                  isActive ? "text-shell/70" : "text-ink/45",
                  isPending && !isActive ? "text-ink/68" : null,
                )}
              >
                {isPending && !isActive ? "Loading" : isActive ? "Now" : "Open"}
              </span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <aside className="panel flex h-full flex-col gap-5 rounded-[1.8rem] p-4 md:p-5 lg:sticky lg:top-5">
      <div className="space-y-5">
        <div className="rounded-[1.25rem] border border-ink/10 bg-white/76 p-4">
          <p className="app-kicker">SmartCompliance</p>
          <h2 className="mt-2 font-[var(--font-display)] text-[2rem] leading-[0.95] text-ink">
            Command Deck
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink/68">
            One place for KYC, monitoring, case handling, and reporting workflows.
          </p>
        </div>

        <nav className="space-y-4">
          <div>
            <p className="app-kicker px-1">Core workflows</p>
            <div className={navSurfaceClassName}>{renderNavLinks(primaryLinks)}</div>
          </div>

          <div>
            <p className="app-kicker px-1">Workspace tools</p>
            <div className={navSurfaceClassName}>{renderNavLinks(supportLinks)}</div>
          </div>
        </nav>
      </div>

      <div className="mt-auto shrink-0 rounded-[1.35rem] border border-ink/14 bg-ink px-4 py-4 text-shell">
        <p className="text-[11px] uppercase tracking-[0.3em] text-shell/70">
          {preview ? "Preview focus" : "Active workspace"}
        </p>
        <p className="mt-2 text-sm leading-6 text-shell/86">
          {preview
            ? "Supabase credentials are not configured yet, so the dashboard remains visible as a scaffold preview."
            : `${viewer?.tenantName ?? "Provisioned tenant"}${
                viewer?.tenantSlug ? ` / ${viewer.tenantSlug}` : ""
              } is signed in with ${viewer ? formatRoleLabel(viewer.role) : "workspace"} access.`}
        </p>
        {!preview ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href={canManage ? "/customers/new" : "/customers"}
              aria-disabled={!canManage}
              className={cn(
                "rounded-full border px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] transition",
                canManage
                  ? "border-shell/26 bg-shell/14 text-shell hover:bg-shell/20"
                  : "cursor-not-allowed border-shell/15 text-shell/45",
              )}
            >
              Customer
            </Link>
            <Link
              href={canManage ? "/reports/new" : "/reports"}
              aria-disabled={!canManage}
              className={cn(
                "rounded-full border px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] transition",
                canManage
                  ? "border-shell/26 bg-shell/14 text-shell hover:bg-shell/20"
                  : "cursor-not-allowed border-shell/15 text-shell/45",
              )}
            >
              Report
            </Link>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
