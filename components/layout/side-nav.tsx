"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { formatRoleLabel, type DashboardViewer } from "@/lib/auth-shared";
import { DASHBOARD_NAV } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SideNavProps = {
  preview?: boolean;
  viewer?: DashboardViewer | null;
};

export function SideNav({ preview = false, viewer = null }: SideNavProps) {
  const pathname = usePathname();
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

  return (
    <aside className="panel flex flex-col justify-between rounded-[2rem] p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-ink/55">
          SmartCompliance
        </p>
        <h2 className="mt-3 font-[var(--font-display)] text-3xl leading-tight text-ink">
          Dashboard
        </h2>
        <p className="mt-3 text-sm leading-7 text-ink/70">
          KYC, AML, monitoring, case management, and reporting.
        </p>
        <nav className="mt-8 space-y-2">
          {DASHBOARD_NAV.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition",
                  isActive
                    ? "bg-ink text-shell shadow-[0_14px_28px_rgba(23,32,51,0.28)]"
                    : "border border-transparent text-ink/72 hover:border-ink/10 hover:bg-white/80",
                )}
              >
                <span className="flex items-center gap-2.5 font-semibold">
                  {(() => {
                    const Icon = iconMap[item.icon];
                    return <Icon className="h-4 w-4" />;
                  })()}
                  {item.label}
                </span>
                <span className={cn("text-xs", isActive ? "text-shell/70" : "text-ink/40")}>
                  {isActive ? "Live" : "Open"}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-[1.5rem] bg-ink px-5 py-4 text-shell">
        <p className="text-xs uppercase tracking-[0.35em] text-shell/70">
          {preview ? "Preview focus" : "Active workspace"}
        </p>
        <p className="mt-3 text-sm leading-7 text-shell/85">
          {preview
            ? "Supabase credentials are not configured yet, so the dashboard remains visible as a scaffold preview."
            : `${viewer?.tenantName ?? "Provisioned tenant"}${
                viewer?.tenantSlug ? ` / ${viewer.tenantSlug}` : ""
              } is signed in with ${viewer ? formatRoleLabel(viewer.role) : "workspace"} access.`}
        </p>
      </div>
    </aside>
  );
}
