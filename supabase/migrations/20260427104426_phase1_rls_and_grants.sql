create or replace function app_private.current_profile_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles as p
  where p.id = auth.uid()
    and p.is_active is true
  limit 1
$$;

create or replace function app_private.current_client_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.client_id
  from public.profiles as p
  where p.id = auth.uid()
    and p.is_active is true
  limit 1
$$;

create or replace function app_private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as p
    where p.id = auth.uid()
      and p.role = 'platform_admin'
      and p.is_active is true
  )
$$;

revoke all on function app_private.current_profile_role() from public;
revoke all on function app_private.current_client_id() from public;
revoke all on function app_private.is_platform_admin() from public;

grant usage on schema app_private to authenticated;

grant execute on function app_private.current_profile_role() to authenticated;
grant execute on function app_private.current_client_id() to authenticated;
grant execute on function app_private.is_platform_admin() to authenticated;

revoke all on table public.clients from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.rsvp_applications from anon, authenticated;
revoke all on table public.rsvp_events from anon, authenticated;
revoke all on table public.event_content from anon, authenticated;
revoke all on table public.payments from anon, authenticated;
revoke all on table public.email_logs from anon, authenticated;
revoke all on table public.audit_logs from anon, authenticated;
revoke all on table public.meta_pixels from anon, authenticated;

grant select, insert, update on table public.clients to authenticated;
grant select, insert, update on table public.profiles to authenticated;
grant select, update on table public.rsvp_applications to authenticated;
grant select, insert, update on table public.rsvp_events to authenticated;
grant select, insert, update on table public.event_content to authenticated;
grant select, insert, update on table public.payments to authenticated;
grant select on table public.email_logs to authenticated;
grant select on table public.audit_logs to authenticated;
grant select, insert, update on table public.meta_pixels to authenticated;

alter table public.clients enable row level security;
alter table public.profiles enable row level security;
alter table public.rsvp_applications enable row level security;
alter table public.rsvp_events enable row level security;
alter table public.event_content enable row level security;
alter table public.payments enable row level security;
alter table public.email_logs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.meta_pixels enable row level security;

create policy clients_admin_all
on public.clients
for all
to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy clients_tenant_select
on public.clients
for select
to authenticated
using (
  id = app_private.current_client_id()
  and app_private.current_profile_role() in ('client_owner', 'client_staff')
);

create policy profiles_admin_all
on public.profiles
for all
to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy profiles_self_select
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy rsvp_applications_admin_all
on public.rsvp_applications
for all
to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy rsvp_events_admin_all
on public.rsvp_events
for all
to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy rsvp_events_tenant_select
on public.rsvp_events
for select
to authenticated
using (
  client_id = app_private.current_client_id()
  and app_private.current_profile_role() in ('client_owner', 'client_staff')
);

create policy event_content_admin_all
on public.event_content
for all
to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy event_content_tenant_select
on public.event_content
for select
to authenticated
using (
  exists (
    select 1
    from public.rsvp_events as e
    where e.id = event_content.event_id
      and e.client_id = app_private.current_client_id()
      and app_private.current_profile_role() in ('client_owner', 'client_staff')
  )
);

create policy payments_admin_all
on public.payments
for all
to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy payments_tenant_select
on public.payments
for select
to authenticated
using (
  client_id = app_private.current_client_id()
  and app_private.current_profile_role() in ('client_owner', 'client_staff')
);

create policy email_logs_admin_select
on public.email_logs
for select
to authenticated
using (app_private.is_platform_admin());

create policy audit_logs_admin_select
on public.audit_logs
for select
to authenticated
using (app_private.is_platform_admin());

create policy meta_pixels_admin_all
on public.meta_pixels
for all
to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());
