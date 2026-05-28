create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  event_type text not null,
  in_app_enabled boolean not null default true,
  push_enabled boolean not null default false,
  email_enabled boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint notification_preferences_event_type_check
    check (event_type in ('new_rsvp_response', 'guest_message', 'billing_update')),
  constraint notification_preferences_profile_client_event_unique
    unique (profile_id, client_id, event_type)
);

create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row
execute function app_private.set_updated_at();

create index if not exists idx_notification_preferences_profile_client
on public.notification_preferences (profile_id, client_id);

create index if not exists idx_notification_preferences_client_event
on public.notification_preferences (client_id, event_type);

insert into public.notification_preferences (
  profile_id,
  client_id,
  event_type,
  in_app_enabled,
  push_enabled,
  email_enabled
)
select
  p.id,
  p.client_id,
  event_types.event_type,
  true,
  false,
  false
from public.profiles as p
cross join (
  values
    ('new_rsvp_response'),
    ('guest_message'),
    ('billing_update')
) as event_types(event_type)
where p.client_id is not null
  and p.role in ('client_owner', 'client_staff')
  and p.is_active is true
on conflict (profile_id, client_id, event_type) do nothing;

revoke all on table public.notification_preferences from anon, authenticated;
grant select, insert, update on table public.notification_preferences to authenticated;
grant select, insert, update, delete on table public.notification_preferences to service_role;

alter table public.notification_preferences enable row level security;

create policy notification_preferences_admin_all
on public.notification_preferences
for all
to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy notification_preferences_tenant_select
on public.notification_preferences
for select
to authenticated
using (
  profile_id = auth.uid()
  and client_id = app_private.current_client_id()
  and app_private.current_profile_role() in ('client_owner', 'client_staff')
);

create policy notification_preferences_tenant_insert
on public.notification_preferences
for insert
to authenticated
with check (
  profile_id = auth.uid()
  and client_id = app_private.current_client_id()
  and app_private.current_profile_role() in ('client_owner', 'client_staff')
);

create policy notification_preferences_tenant_update
on public.notification_preferences
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
