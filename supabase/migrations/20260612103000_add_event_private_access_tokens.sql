alter table if exists public.rsvp_events
add column if not exists private_access_token text;

alter table if exists public.rsvp_events
add column if not exists private_access_token_rotated_at timestamptz;

create unique index if not exists rsvp_events_private_access_token_key
  on public.rsvp_events (private_access_token)
  where private_access_token is not null;
