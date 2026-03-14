import Link from "next/link";
import { ActivityIcon } from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { listCustomers } from "@/modules/customers/repository";
import {
  listAlerts,
  listTransactions,
} from "@/modules/transactions/repository";
import {
  ALERT_SEVERITIES,
  ALERT_STATUSES,
  TRANSACTION_STATUSES,
} from "@/modules/transactions/types";
import {
  alertFiltersSchema,
  transactionFiltersSchema,
} from "@/modules/transactions/validation";

export const metadata = {
  title: "Monitoring | SmartCompliance",
};

type MonitoringPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function txStatusClass(status: string) {
  switch (status) {
    case "cleared":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "flagged":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "blocked":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-sky-200 bg-sky-50 text-sky-700";
  }
}

function alertSeverityClass(severity: string) {
  switch (severity) {
    case "critical":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "high":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "medium":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}

export default async function MonitoringPage({
  searchParams,
}: MonitoringPageProps) {
  const params = searchParams ? await searchParams : {};
  const parsedTransactionFilters = transactionFiltersSchema.safeParse({
    status:
      typeof params.txStatus === "string" ? params.txStatus : params.txStatus?.[0],
    customerId:
      typeof params.customerId === "string"
        ? params.customerId
        : params.customerId?.[0],
    q: typeof params.q === "string" ? params.q : params.q?.[0],
  });
  const parsedAlertFilters = alertFiltersSchema.safeParse({
    status:
      typeof params.alertStatus === "string"
        ? params.alertStatus
        : params.alertStatus?.[0],
    severity:
      typeof params.severity === "string" ? params.severity : params.severity?.[0],
    customerId:
      typeof params.customerId === "string"
        ? params.customerId
        : params.customerId?.[0],
  });

  const transactionFilters = parsedTransactionFilters.success
    ? {
        status: parsedTransactionFilters.data.status,
        customerId: parsedTransactionFilters.data.customerId,
        query: parsedTransactionFilters.data.q,
      }
    : {};
  const alertFilters = parsedAlertFilters.success
    ? {
        status: parsedAlertFilters.data.status,
        severity: parsedAlertFilters.data.severity,
        customerId: parsedAlertFilters.data.customerId,
      }
    : {};

  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;
  const canManage = tenantContext ? canManageTenant(tenantContext.role) : false;

  let customers: Awaited<ReturnType<typeof listCustomers>> = [];
  let transactions: Awaited<ReturnType<typeof listTransactions>> = [];
  let alerts: Awaited<ReturnType<typeof listAlerts>> = [];

  if (isSupabaseEnabled && tenantContext) {
    const supabase = await createClient();
    [customers, transactions, alerts] = await Promise.all([
      listCustomers(
        {
          supabase,
          tenantId: tenantContext.tenantId,
        },
        {},
      ),
      listTransactions(
        {
          supabase,
          tenantId: tenantContext.tenantId,
        },
        transactionFilters,
      ),
      listAlerts(
        {
          supabase,
          tenantId: tenantContext.tenantId,
        },
        alertFilters,
      ),
    ]);
  }

  const hasActiveFilters = Boolean(
    transactionFilters.status ||
      transactionFilters.customerId ||
      transactionFilters.query ||
      alertFilters.status ||
      alertFilters.severity,
  );

  return (
    <section className="space-y-6">
      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex rounded-xl bg-ink p-2 text-shell">
                <ActivityIcon />
              </span>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/55">
                Transaction monitoring
              </p>
            </div>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl leading-tight text-ink md:text-5xl">
              Monitoring
            </h1>
            <p className="mt-2 text-sm leading-7 text-ink/70">
              Monitor transactions, detect suspicious patterns, and resolve alerts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={canManage ? "/monitoring/new" : "/monitoring"}
              aria-disabled={!canManage}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                canManage
                  ? "bg-ink text-shell hover:bg-ink/92"
                  : "cursor-not-allowed border border-ink/15 text-ink/45"
              }`}
            >
              Ingest transaction
            </Link>
            <Link
              href={canManage ? "/monitoring/alerts" : "/monitoring"}
              aria-disabled={!canManage}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                canManage
                  ? "border-ink/20 text-ink hover:border-ink/35 hover:bg-white"
                  : "cursor-not-allowed border-ink/15 text-ink/45"
              }`}
            >
              Update alert
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <article className="rounded-[1rem] border border-ink/10 bg-white/88 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-ink/52">Transactions</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{transactions.length}</p>
          </article>
          <article className="rounded-[1rem] border border-ink/10 bg-white/88 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-ink/52">Alerts</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{alerts.length}</p>
          </article>
          <article className="rounded-[1rem] border border-ink/10 bg-white/88 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-ink/52">Critical</p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {alerts.filter((item) => item.severity === "critical").length}
            </p>
          </article>
        </div>
      </article>

      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-ink/52">Transactions</p>
            <p className="mt-2 text-sm text-ink/70">Filter and review transaction stream.</p>
          </div>
          <form className="grid gap-2 sm:grid-cols-[minmax(170px,1fr)_150px_140px_auto_auto]">
            <input
              name="q"
              defaultValue={transactionFilters.query ?? ""}
              className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-ink/35"
              placeholder="Search customer or type"
            />
            <select
              name="customerId"
              defaultValue={transactionFilters.customerId ?? ""}
              className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-ink/35"
            >
              <option value="">All customers</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.firstName} {customer.lastName}
                </option>
              ))}
            </select>
            <select
              name="txStatus"
              defaultValue={transactionFilters.status ?? ""}
              className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-ink/35"
            >
              <option value="">All status</option>
              {TRANSACTION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-shell transition hover:bg-ink/92"
            >
              Apply
            </button>
            {hasActiveFilters ? (
              <Link
                href="/monitoring"
                className="rounded-xl border border-ink/15 px-4 py-2.5 text-center text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white"
              >
                Reset
              </Link>
            ) : null}
          </form>
        </div>

        <div className="mt-6 overflow-hidden rounded-[1.2rem] border border-ink/10 bg-white/88">
          <div className="hidden border-b border-ink/10 bg-shell/70 px-4 py-3 text-xs uppercase tracking-[0.24em] text-ink/52 md:grid md:grid-cols-[1.8fr_110px_110px_120px_120px]">
            <p>Customer / Type</p>
            <p>Amount</p>
            <p>Currency</p>
            <p>Status</p>
            <p>Date</p>
          </div>
          {transactions.length > 0 ? (
            transactions.map((item) => (
              <article
                key={item.id}
                className="border-b border-ink/8 px-4 py-4 last:border-b-0 md:grid md:grid-cols-[1.8fr_110px_110px_120px_120px] md:items-center md:gap-3"
              >
                <div>
                  <p className="font-semibold text-ink">{item.customerName}</p>
                  <p className="mt-1 text-xs text-ink/55">
                    {item.transactionType} • {item.id.slice(0, 8)}
                  </p>
                </div>
                <p className="mt-2 text-sm text-ink/68 md:mt-0">{item.amount.toFixed(2)}</p>
                <p className="mt-2 text-sm text-ink/68 md:mt-0">{item.currency}</p>
                <div className="mt-2 md:mt-0">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${txStatusClass(
                      item.status,
                    )}`}
                  >
                    {formatLabel(item.status)}
                  </span>
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink/54 md:mt-0">
                  {formatDate(item.createdAt)}
                </p>
              </article>
            ))
          ) : (
            <div className="px-4 py-8 text-sm text-ink/68">
              No transactions matched these filters.
            </div>
          )}
        </div>
      </article>

      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-ink/52">Alerts</p>
            <p className="mt-2 text-sm text-ink/70">Review generated alerts and severity.</p>
          </div>
          <form className="grid gap-2 sm:grid-cols-[150px_150px_auto]">
            <input type="hidden" name="q" value={transactionFilters.query ?? ""} />
            <input type="hidden" name="customerId" value={transactionFilters.customerId ?? ""} />
            <input type="hidden" name="txStatus" value={transactionFilters.status ?? ""} />
            <select
              name="alertStatus"
              defaultValue={alertFilters.status ?? ""}
              className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-ink/35"
            >
              <option value="">All status</option>
              {ALERT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
            <select
              name="severity"
              defaultValue={alertFilters.severity ?? ""}
              className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-ink/35"
            >
              <option value="">All severity</option>
              {ALERT_SEVERITIES.map((severity) => (
                <option key={severity} value={severity}>
                  {formatLabel(severity)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-shell transition hover:bg-ink/92"
            >
              Filter
            </button>
          </form>
        </div>

        <div className="mt-4 grid gap-3">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <article
                key={alert.id}
                className="rounded-[1rem] border border-ink/10 bg-white/88 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">
                    {formatLabel(alert.alertType)}
                  </p>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${alertSeverityClass(
                      alert.severity,
                    )}`}
                  >
                    {formatLabel(alert.severity)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-ink/55">
                  {alert.customerName} • {formatLabel(alert.status)} •{" "}
                  {formatDate(alert.createdAt)}
                </p>
                <p className="mt-2 text-sm text-ink/68">{alert.description}</p>
              </article>
            ))
          ) : (
            <p className="text-sm text-ink/65">No alerts matched these filters.</p>
          )}
        </div>
      </article>
    </section>
  );
}
