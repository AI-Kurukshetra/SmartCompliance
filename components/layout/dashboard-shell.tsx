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
    <div className="shell-grid relative min-h-screen overflow-hidden bg-radial-shell px-3 py-3 md:px-5 md:py-5">
      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-[#d1efdf] blur-3xl float-slow" />
      <div className="pointer-events-none absolute -left-20 bottom-16 h-72 w-72 rounded-full bg-[#ffe2c2] blur-3xl float-delay" />

      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[1280px] flex-col gap-4">
        <TopBar preview={preview} viewer={viewer} />

        <div className="grid flex-1 gap-4 lg:grid-cols-[300px_1fr]">
          <div className="order-2 lg:order-1">
            <SideNav preview={preview} viewer={viewer} />
          </div>
          <main className="panel-strong order-1 flex-1 rounded-[1.8rem] p-4 sm:p-5 md:p-7 lg:order-2">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
