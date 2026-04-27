create table public.meta_pixels (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id),
  event_id uuid references public.rsvp_events (id),
  pixel_id text not null,
  access_token_encrypted text,
  is_active boolean not null default true,
  tracking_scope text not null default 'platform',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint meta_pixels_tracking_scope_check
    check (tracking_scope in ('platform', 'client', 'event')),
  constraint meta_pixels_tracking_scope_relationship_check
    check (
      (tracking_scope = 'platform' and client_id is null and event_id is null)
      or (tracking_scope = 'client' and client_id is not null and event_id is null)
      or (tracking_scope = 'event' and event_id is not null)
    )
);

create trigger set_meta_pixels_updated_at
before update on public.meta_pixels
for each row
execute function app_private.set_updated_at();
