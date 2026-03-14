import type { PlatformModule } from "@/modules/types";

export const PLATFORM_MODULES: PlatformModule[] = [
  { slug: "customers", label: "Customers", route: "/customers" },
  { slug: "verifications", label: "Verifications", route: "/verifications" },
  { slug: "documents", label: "Documents", route: "/verifications" },
  { slug: "watchlist", label: "Watchlist", route: "/verifications" },
  { slug: "risk", label: "Risk", route: "/rules" },
  { slug: "cases", label: "Cases", route: "/cases" },
  { slug: "transactions", label: "Monitoring", route: "/monitoring" },
  { slug: "rules", label: "Rules", route: "/rules" },
  { slug: "reports", label: "Reports", route: "/reports" },
  { slug: "audit", label: "Audit", route: "/reports" },
  { slug: "analytics", label: "Analytics", route: "/dashboard" },
];
