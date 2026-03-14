import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthState } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authState = await getAuthState();

  if (authState.enabled && !authState.viewer) {
    redirect(
      authState.hasSession
        ? "/login?reason=account"
        : "/login?reason=auth-required",
    );
  }

  return (
    <DashboardShell
      preview={!authState.enabled}
      viewer={authState.viewer}
    >
      {children}
    </DashboardShell>
  );
}
