create or replace function public.sync_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  requested_tenant_id uuid;
  requested_role public.app_role;
begin
  requested_tenant_id := nullif(metadata ->> 'tenant_id', '')::uuid;

  if requested_tenant_id is null then
    return new;
  end if;

  requested_role := coalesce(
    nullif(metadata ->> 'role', ''),
    'developer'
  )::public.app_role;

  insert into public.users (
    id,
    tenant_id,
    email,
    full_name,
    role
  )
  values (
    new.id,
    requested_tenant_id,
    coalesce(new.email, ''),
    nullif(metadata ->> 'full_name', ''),
    requested_role
  )
  on conflict (id) do update
  set
    tenant_id = excluded.tenant_id,
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    deleted_at = null;

  return new;
end;
$$;

drop trigger if exists sync_auth_user_profile on auth.users;

create trigger sync_auth_user_profile
after insert or update of email, raw_user_meta_data on auth.users
for each row
execute function public.sync_auth_user_profile();
