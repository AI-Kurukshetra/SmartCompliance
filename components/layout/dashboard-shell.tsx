import type { DashboardViewer } from "@/lib/auth-shared";
import { SideNav } from "@/components/layout/side-nav";
import { TopBar } from "@/components/layout/top-bar";

export function DashboardShell({
  children,
  preview = false,
  viewer = null,
}: Readonly<{
  children: React.ReactNode;
  preview?: boolean;
  viewer?: DashboardViewer | null;
}>) {
  return (
    <div className="shell-grid min-h-screen bg-radial-shell px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-7xl gap-4 lg:grid-cols-[280px_1fr]">
        <SideNav preview={preview} viewer={viewer} />
        <div className="flex min-h-full flex-col gap-4">
          <TopBar preview={preview} viewer={viewer} />
          <main className="flex-1 rounded-[2rem] border border-ink/10 bg-white/72 p-5 shadow-panel backdrop-blur-xl md:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
