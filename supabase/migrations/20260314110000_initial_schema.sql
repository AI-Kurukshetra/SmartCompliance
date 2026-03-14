create extension if not exists pgcrypto;

do $$
begin
  create type public.app_role as enum ('admin', 'compliance_officer', 'developer');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.tenant_status as enum ('active', 'suspended', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.risk_level as enum ('low', 'medium', 'high', 'critical');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.verification_status as enum ('pending', 'collecting_documents', 'screening', 'review', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.decision_status as enum ('approved', 'rejected', 'manual_review');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.document_status as enum ('uploaded', 'processing', 'verified', 'rejected');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.screening_status as enum ('clear', 'possible_match', 'confirmed_match', 'manual_review');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.case_status as enum ('open', 'in_review', 'resolved', 'closed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.transaction_status as enum ('pending', 'cleared', 'flagged', 'blocked');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.alert_severity as enum ('low', 'medium', 'high', 'critical');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.alert_status as enum ('open', 'acknowledged', 'resolved');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.report_type as enum ('sar', 'ctr', 'audit_export', 'operations_summary');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.report_status as enum ('queued', 'processing', 'ready', 'failed');
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.prevent_audit_log_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_logs are immutable';
end;
$$;

create or replace function public.is_service_role()
returns boolean
language sql
stable
as $$
  select auth.role() = 'service_role';
$$;

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id
  from public.users
  where id = auth.uid()
    and deleted_at is null
  limit 1;
$$;

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.users
  where id = auth.uid()
    and deleted_at is null
  limit 1;
$$;

create or replace function public.owns_record(record_tenant_id uuid)
returns boolean
language sql
stable
as $$
  select public.is_service_role() or record_tenant_id = public.current_tenant_id();
$$;

create or replace function public.can_manage_tenant()
returns boolean
language sql
stable
as $$
  select public.is_service_role() or public.current_user_role() in ('admin', 'compliance_officer');
$$;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan_tier text not null default 'starter',
  status public.tenant_status not null default 'active',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  email text not null,
  full_name text,
  role public.app_role not null default 'developer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, email)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  external_customer_id text,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  date_of_birth date,
  country_code char(2),
  risk_level public.risk_level not null default 'low',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.verification_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  customer_id uuid not null references public.customers (id) on delete cascade,
  status public.verification_status not null default 'pending',
  decision public.decision_status not null default 'manual_review',
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  customer_id uuid not null references public.customers (id) on delete cascade,
  verification_session_id uuid not null references public.verification_sessions (id) on delete cascade,
  document_type text not null,
  storage_path text not null,
  mime_type text,
  status public.document_status not null default 'uploaded',
  document_confidence numeric(5,2) check (document_confidence is null or document_confidence between 0 and 100),
  ocr_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.watchlist_results (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  verification_session_id uuid not null references public.verification_sessions (id) on delete cascade,
  provider text not null,
  status public.screening_status not null default 'clear',
  match_score numeric(5,2) check (match_score is null or match_score between 0 and 100),
  match_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.risk_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  customer_id uuid not null references public.customers (id) on delete cascade,
  verification_session_id uuid references public.verification_sessions (id) on delete cascade,
  risk_score integer not null check (risk_score between 0 and 100),
  risk_level public.risk_level not null,
  factors jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  verification_session_id uuid references public.verification_sessions (id) on delete set null,
  assigned_to uuid references public.users (id) on delete set null,
  status public.case_status not null default 'open',
  resolution_decision public.decision_status,
  priority public.alert_severity not null default 'medium',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  deleted_at timestamptz
);

create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  name text not null,
  description text,
  condition jsonb not null default '{}'::jsonb,
  score integer not null default 0,
  decision_action public.decision_status,
  enabled boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  customer_id uuid not null references public.customers (id) on delete cascade,
  amount numeric(18,2) not null,
  currency char(3) not null,
  transaction_type text not null,
  status public.transaction_status not null default 'pending',
  counterparty_country char(2),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  customer_id uuid references public.customers (id) on delete cascade,
  transaction_id uuid references public.transactions (id) on delete cascade,
  verification_session_id uuid references public.verification_sessions (id) on delete cascade,
  alert_type text not null,
  severity public.alert_severity not null default 'medium',
  status public.alert_status not null default 'open',
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  actor_user_id uuid references public.users (id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  report_type public.report_type not null,
  status public.report_status not null default 'queued',
  generated_by uuid references public.users (id) on delete set null,
  report_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  deleted_at timestamptz
);

create index if not exists idx_users_tenant_id on public.users (tenant_id);
create index if not exists idx_customers_tenant_id on public.customers (tenant_id);
create index if not exists idx_customers_email on public.customers (tenant_id, email);
create index if not exists idx_verification_sessions_tenant_status on public.verification_sessions (tenant_id, status);
create index if not exists idx_verification_sessions_customer_id on public.verification_sessions (customer_id);
create index if not exists idx_documents_verification_session_id on public.documents (verification_session_id);
create index if not exists idx_documents_tenant_status on public.documents (tenant_id, status);
create index if not exists idx_watchlist_results_verification_session_id on public.watchlist_results (verification_session_id);
create index if not exists idx_risk_profiles_customer_id on public.risk_profiles (customer_id);
create index if not exists idx_cases_tenant_status on public.cases (tenant_id, status);
create index if not exists idx_rules_tenant_enabled on public.rules (tenant_id, enabled);
create index if not exists idx_transactions_tenant_status on public.transactions (tenant_id, status);
create index if not exists idx_alerts_tenant_status on public.alerts (tenant_id, status);
create index if not exists idx_audit_logs_tenant_created_at on public.audit_logs (tenant_id, created_at desc);
create index if not exists idx_reports_tenant_status on public.reports (tenant_id, status);

create trigger set_tenants_updated_at
before update on public.tenants
for each row
execute function public.set_updated_at();

create trigger set_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

create trigger set_customers_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

create trigger set_verification_sessions_updated_at
before update on public.verification_sessions
for each row
execute function public.set_updated_at();

create trigger set_documents_updated_at
before update on public.documents
for each row
execute function public.set_updated_at();

create trigger set_watchlist_results_updated_at
before update on public.watchlist_results
for each row
execute function public.set_updated_at();

create trigger set_risk_profiles_updated_at
before update on public.risk_profiles
for each row
execute function public.set_updated_at();

create trigger set_cases_updated_at
before update on public.cases
for each row
execute function public.set_updated_at();

create trigger set_rules_updated_at
before update on public.rules
for each row
execute function public.set_updated_at();

create trigger set_transactions_updated_at
before update on public.transactions
for each row
execute function public.set_updated_at();

create trigger set_alerts_updated_at
before update on public.alerts
for each row
execute function public.set_updated_at();

create trigger set_reports_updated_at
before update on public.reports
for each row
execute function public.set_updated_at();

create trigger prevent_audit_log_update
before update on public.audit_logs
for each row
execute function public.prevent_audit_log_mutation();

create trigger prevent_audit_log_delete
before delete on public.audit_logs
for each row
execute function public.prevent_audit_log_mutation();

alter table public.tenants enable row level security;
alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.verification_sessions enable row level security;
alter table public.documents enable row level security;
alter table public.watchlist_results enable row level security;
alter table public.risk_profiles enable row level security;
alter table public.cases enable row level security;
alter table public.rules enable row level security;
alter table public.transactions enable row level security;
alter table public.alerts enable row level security;
alter table public.audit_logs enable row level security;
alter table public.reports enable row level security;

create policy "tenant read access"
on public.tenants
for select
using (public.is_service_role() or id = public.current_tenant_id());

create policy "tenant admin updates"
on public.tenants
for update
using (public.is_service_role() or (id = public.current_tenant_id() and public.current_user_role() = 'admin'))
with check (public.is_service_role() or (id = public.current_tenant_id() and public.current_user_role() = 'admin'));

create policy "service role manages tenants"
on public.tenants
for insert
with check (public.is_service_role());

create policy "users select own tenant"
on public.users
for select
using (public.owns_record(tenant_id));

create policy "users manage profiles"
on public.users
for all
using (
  public.is_service_role()
  or id = auth.uid()
  or (public.can_manage_tenant() and public.owns_record(tenant_id))
)
with check (
  public.is_service_role()
  or id = auth.uid()
  or (public.can_manage_tenant() and public.owns_record(tenant_id))
);

create policy "customers tenant access"
on public.customers
for select
using (public.owns_record(tenant_id));

create policy "customers tenant management"
on public.customers
for all
using (public.can_manage_tenant() and public.owns_record(tenant_id))
with check (public.can_manage_tenant() and public.owns_record(tenant_id));

create policy "verification sessions tenant access"
on public.verification_sessions
for select
using (public.owns_record(tenant_id));

create policy "verification sessions tenant management"
on public.verification_sessions
for all
using (public.can_manage_tenant() and public.owns_record(tenant_id))
with check (public.can_manage_tenant() and public.owns_record(tenant_id));

create policy "documents tenant access"
on public.documents
for select
using (public.owns_record(tenant_id));

create policy "documents tenant management"
on public.documents
for all
using (public.can_manage_tenant() and public.owns_record(tenant_id))
with check (public.can_manage_tenant() and public.owns_record(tenant_id));

create policy "watchlist tenant access"
on public.watchlist_results
for select
using (public.owns_record(tenant_id));

create policy "watchlist tenant management"
on public.watchlist_results
for all
using (public.can_manage_tenant() and public.owns_record(tenant_id))
with check (public.can_manage_tenant() and public.owns_record(tenant_id));

create policy "risk profiles tenant access"
on public.risk_profiles
for select
using (public.owns_record(tenant_id));

create policy "risk profiles tenant management"
on public.risk_profiles
for all
using (public.can_manage_tenant() and public.owns_record(tenant_id))
with check (public.can_manage_tenant() and public.owns_record(tenant_id));

create policy "cases tenant access"
on public.cases
for select
using (public.owns_record(tenant_id));

create policy "cases tenant management"
on public.cases
for all
using (public.can_manage_tenant() and public.owns_record(tenant_id))
with check (public.can_manage_tenant() and public.owns_record(tenant_id));

create policy "rules tenant access"
on public.rules
for select
using (public.owns_record(tenant_id));

create policy "rules tenant management"
on public.rules
for all
using (public.can_manage_tenant() and public.owns_record(tenant_id))
with check (public.can_manage_tenant() and public.owns_record(tenant_id));

create policy "transactions tenant access"
on public.transactions
for select
using (public.owns_record(tenant_id));

create policy "transactions tenant management"
on public.transactions
for all
using (public.can_manage_tenant() and public.owns_record(tenant_id))
with check (public.can_manage_tenant() and public.owns_record(tenant_id));

create policy "alerts tenant access"
on public.alerts
for select
using (public.owns_record(tenant_id));

create policy "alerts tenant management"
on public.alerts
for all
using (public.can_manage_tenant() and public.owns_record(tenant_id))
with check (public.can_manage_tenant() and public.owns_record(tenant_id));

create policy "audit logs tenant access"
on public.audit_logs
for select
using (public.owns_record(tenant_id));

create policy "audit logs insert"
on public.audit_logs
for insert
with check (public.can_manage_tenant() and public.owns_record(tenant_id));

create policy "reports tenant access"
on public.reports
for select
using (public.owns_record(tenant_id));

create policy "reports tenant management"
on public.reports
for all
using (public.can_manage_tenant() and public.owns_record(tenant_id))
with check (public.can_manage_tenant() and public.owns_record(tenant_id));
