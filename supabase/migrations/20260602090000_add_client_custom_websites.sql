create table public.client_custom_websites (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  event_id uuid not null references public.rsvp_events(id) on delete cascade,
  custom_frontend_origin_url text null,
  custom_frontend_enabled boolean not null default false,
  template_id text not null default 'wedding-custom-starter-v1',
  platform_event_slug text null,
  status text not null default 'not_started',
  connected_at timestamptz null,
  disabled_at timestamptz null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_custom_websites_event_id_key unique (event_id),
  constraint client_custom_websites_status_check check (
    status in ('not_started', 'origin_saved', 'enabled', 'disabled', 'paused')
  )
);

create index client_custom_websites_client_id_idx
  on public.client_custom_websites (client_id);

create trigger set_client_custom_websites_updated_at
before update on public.client_custom_websites
for each row
execute function app_private.set_updated_at();

alter table public.client_custom_websites enable row level security;

revoke all on table public.client_custom_websites from anon;
revoke all on table public.client_custom_websites from authenticated;
grant select, insert, update, delete on table public.client_custom_websites to service_role;

update public.platform_package_settings
set
  renewal_notice_days = 30,
  updated_at = timezone('utc'::text, now())
where
  default_hosting_days is not null
  and renewal_notice_days is not null
  and renewal_notice_days >= default_hosting_days;

update public.payments
set renewal_required_at = hosting_ends_at - interval '30 days'
where
  hosting_starts_at is not null
  and hosting_ends_at is not null
  and renewal_required_at is not null
  and renewal_required_at <= hosting_starts_at;

update public.clients
set renewal_required_at = hosting_ends_at - interval '30 days'
where
  hosting_starts_at is not null
  and hosting_ends_at is not null
  and renewal_required_at is not null
  and renewal_required_at <= hosting_starts_at;

alter table public.platform_package_settings
add constraint platform_package_settings_renewal_notice_window_check
check (
  renewal_notice_days is null
  or default_hosting_days is null
  or renewal_notice_days < default_hosting_days
);
