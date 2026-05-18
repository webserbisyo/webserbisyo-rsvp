create or replace function app_private.validate_rsvp_response_event_client_match()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.rsvp_events as e
    where e.id = new.event_id
      and e.client_id = new.client_id
  ) then
    raise exception 'rsvp_responses.event_id must belong to rsvp_responses.client_id';
  end if;

  return new;
end;
$$;

revoke all on function app_private.validate_rsvp_response_event_client_match() from public;

create table public.rsvp_responses (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  event_id uuid not null references public.rsvp_events (id) on delete restrict,
  guest_name text not null,
  email text,
  phone text,
  attendance_status text not null,
  party_size integer not null default 1,
  dietary_notes text,
  message text,
  source text,
  submitted_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz,
  constraint rsvp_responses_attendance_status_check
    check (attendance_status in ('attending', 'not_attending')),
  constraint rsvp_responses_party_size_check
    check (party_size >= 1),
  constraint rsvp_responses_guest_name_check
    check (length(btrim(guest_name)) > 0)
);

create table public.rsvp_response_companions (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.rsvp_responses (id) on delete cascade,
  full_name text not null,
  age_label text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint rsvp_response_companions_full_name_check
    check (length(btrim(full_name)) > 0)
);

create trigger validate_rsvp_responses_event_client_match
before insert or update on public.rsvp_responses
for each row
execute function app_private.validate_rsvp_response_event_client_match();

create trigger set_rsvp_responses_updated_at
before update on public.rsvp_responses
for each row
execute function app_private.set_updated_at();

create index if not exists idx_rsvp_responses_client_event_submitted_at
on public.rsvp_responses (client_id, event_id, submitted_at desc);

create index if not exists idx_rsvp_responses_event_attendance_status
on public.rsvp_responses (event_id, attendance_status);

create index if not exists idx_rsvp_responses_client_submitted_at
on public.rsvp_responses (client_id, submitted_at desc);

create index if not exists idx_rsvp_response_companions_response_id
on public.rsvp_response_companions (response_id);

revoke all on table public.rsvp_responses from anon, authenticated;
revoke all on table public.rsvp_response_companions from anon, authenticated;

grant select on table public.rsvp_responses to authenticated;
grant select on table public.rsvp_response_companions to authenticated;

grant select, insert, update, delete on table public.rsvp_responses to service_role;
grant select, insert, update, delete on table public.rsvp_response_companions to service_role;

alter table public.rsvp_responses enable row level security;
alter table public.rsvp_response_companions enable row level security;

create policy rsvp_responses_admin_all
on public.rsvp_responses
for all
to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy rsvp_responses_tenant_select
on public.rsvp_responses
for select
to authenticated
using (
  client_id = app_private.current_client_id()
  and app_private.current_profile_role() in ('client_owner', 'client_staff')
);

create policy rsvp_response_companions_admin_all
on public.rsvp_response_companions
for all
to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy rsvp_response_companions_tenant_select
on public.rsvp_response_companions
for select
to authenticated
using (
  exists (
    select 1
    from public.rsvp_responses as r
    where r.id = rsvp_response_companions.response_id
      and r.client_id = app_private.current_client_id()
      and app_private.current_profile_role() in ('client_owner', 'client_staff')
  )
);

comment on table public.rsvp_responses is
  'Submitted guest RSVP responses for client events.';

comment on table public.rsvp_response_companions is
  'Companion names attached to an RSVP response.';

comment on column public.rsvp_responses.source is
  'Internal submission source label; not shown in the main dashboard table by default.';
