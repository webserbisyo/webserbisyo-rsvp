create table public.event_content (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.rsvp_events (id) on delete cascade,
  hero_title text,
  hero_subtitle text,
  couple_or_celebrant_names text,
  event_story text,
  dress_code text,
  schedule_note text,
  venue_note text,
  rsvp_note text,
  gift_note text,
  contact_note text,
  theme_key text,
  content_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint event_content_content_json_object_check
    check (jsonb_typeof(content_json) = 'object')
);

create trigger set_event_content_updated_at
before update on public.event_content
for each row
execute function app_private.set_updated_at();
