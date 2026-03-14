create or replace function public.enforce_user_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_service_role() then
    return new;
  end if;

  if new.id <> old.id then
    raise exception 'User identity cannot be changed.';
  end if;

  if new.tenant_id <> old.tenant_id then
    raise exception 'Tenant assignment cannot be changed.';
  end if;

  if new.role <> old.role then
    if auth.uid() = old.id then
      raise exception 'Users cannot change their own role.';
    end if;

    if public.current_user_role() <> 'admin' then
      raise exception 'Only admins can change user roles.';
    end if;
  end if;

  if auth.uid() <> old.id and not public.can_manage_tenant() then
    raise exception 'Insufficient privileges to update this user profile.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_user_profile_update on public.users;
create trigger enforce_user_profile_update
before update on public.users
for each row
execute function public.enforce_user_profile_update();

create index if not exists idx_cases_tenant_assigned_status_active
on public.cases (tenant_id, assigned_to, status)
where deleted_at is null;

create index if not exists idx_transactions_tenant_customer_created_at_active
on public.transactions (tenant_id, customer_id, created_at desc)
where deleted_at is null;

create index if not exists idx_alerts_tenant_severity_created_at_active
on public.alerts (tenant_id, severity, created_at desc)
where deleted_at is null;

create index if not exists idx_reports_tenant_type_created_at_active
on public.reports (tenant_id, report_type, created_at desc)
where deleted_at is null;

create index if not exists idx_audit_logs_tenant_entity_created_at
on public.audit_logs (tenant_id, entity_type, created_at desc);
