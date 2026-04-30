create table public.rsvp_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  event_slug text not null,
  title text not null,
  event_type text not null,
  event_date date,
  event_time time,
  venue_name text,
  venue_address text,
  status text not null default 'draft',
  visibility text not null default 'private',
  fallback_page_enabled boolean not null default true,
  custom_frontend_enabled boolean not null default false,
  custom_frontend_url text,
  rsvp_open_at timestamptz,
  rsvp_close_at timestamptz,
  max_guest_count integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  published_at timestamptz,
  archived_at timestamptz,
  constraint rsvp_events_status_check
    check (status in ('draft', 'setup_in_progress', 'ready', 'published', 'archived')),
  constraint rsvp_events_event_type_check
    check (event_type in ('wedding', 'debut', 'birthday', 'baptism', 'reunion', 'anniversary', 'corporate', 'other')),
  constraint rsvp_events_visibility_check
    check (visibility in ('private', 'public', 'unlisted')),
  constraint rsvp_events_max_guest_count_check
    check (max_guest_count is null or max_guest_count > 0),
  constraint rsvp_events_rsvp_window_check
    check (
      rsvp_open_at is null
      or rsvp_close_at is null
      or rsvp_close_at >= rsvp_open_at
    ),
  constraint rsvp_events_event_slug_format_check
    check (event_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create trigger set_rsvp_events_updated_at
before update on public.rsvp_events
for each row
execute function app_private.set_updated_at();

create trigger prevent_rsvp_events_event_slug_update
before update of event_slug on public.rsvp_events
for each row
execute function app_private.prevent_event_slug_update();
