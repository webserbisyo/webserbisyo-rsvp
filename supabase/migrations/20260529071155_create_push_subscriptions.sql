create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  platform text,
  enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz,
  revoked_at timestamptz,
  constraint push_subscriptions_endpoint_unique unique (endpoint)
);

create trigger set_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row
execute function app_private.set_updated_at();

create index if not exists idx_push_subscriptions_profile_client
on public.push_subscriptions (profile_id, client_id);

create index if not exists idx_push_subscriptions_client_enabled
on public.push_subscriptions (client_id, enabled)
where revoked_at is null;

revoke all on table public.push_subscriptions from anon, authenticated;
grant select, insert, update, delete on table public.push_subscriptions to authenticated;
grant select, insert, update, delete on table public.push_subscriptions to service_role;

alter table public.push_subscriptions enable row level security;

create policy push_subscriptions_admin_all
on public.push_subscriptions
for all
to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy push_subscriptions_tenant_select
on public.push_subscriptions
for select
to authenticated
using (
  profile_id = auth.uid()
  and client_id = app_private.current_client_id()
  and app_private.current_profile_role() in ('client_owner', 'client_staff')
);

create policy push_subscriptions_tenant_insert
on public.push_subscriptions
for insert
to authenticated
with check (
  profile_id = auth.uid()
  and client_id = app_private.current_client_id()
  and app_private.current_profile_role() in ('client_owner', 'client_staff')
);

create policy push_subscriptions_tenant_update
on public.push_subscriptions
for update
to authenticated
using (
  profile_id = auth.uid()
  and client_id = app_private.current_client_id()
  and app_private.current_profile_role() in ('client_owner', 'client_staff')
)
with check (
  profile_id = auth.uid()
  and client_id = app_private.current_client_id()
  and app_private.current_profile_role() in ('client_owner', 'client_staff')
);

create policy push_subscriptions_tenant_delete
on public.push_subscriptions
for delete
to authenticated
using (
  profile_id = auth.uid()
  and client_id = app_private.current_client_id()
  and app_private.current_profile_role() in ('client_owner', 'client_staff')
);
