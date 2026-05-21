alter table public.rsvp_events
add column if not exists draft_event_slug text;

alter table public.rsvp_events
add column if not exists draft_visibility text;

alter table public.rsvp_events
add column if not exists website_access_updated_at timestamptz
not null
default timezone('utc', now());

update public.rsvp_events
set
  draft_event_slug = coalesce(draft_event_slug, event_slug),
  draft_visibility = coalesce(draft_visibility, visibility),
  website_access_updated_at = coalesce(
    website_access_updated_at,
    updated_at,
    created_at,
    timezone('utc', now())
  );

alter table public.rsvp_events
alter column draft_event_slug set not null;

alter table public.rsvp_events
alter column draft_visibility set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rsvp_events_draft_visibility_check'
      and conrelid = 'public.rsvp_events'::regclass
  ) then
    alter table public.rsvp_events
    add constraint rsvp_events_draft_visibility_check
    check (draft_visibility in ('private', 'public', 'unlisted'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rsvp_events_draft_event_slug_format_check'
      and conrelid = 'public.rsvp_events'::regclass
  ) then
    alter table public.rsvp_events
    add constraint rsvp_events_draft_event_slug_format_check
    check (draft_event_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  end if;
end
$$;

create index if not exists idx_rsvp_events_draft_event_slug
on public.rsvp_events (draft_event_slug);

create or replace function app_private.initialize_website_access_draft_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.draft_event_slug = coalesce(new.draft_event_slug, new.event_slug);
  new.draft_visibility = coalesce(new.draft_visibility, new.visibility);
  new.website_access_updated_at = coalesce(new.website_access_updated_at, timezone('utc', now()));

  return new;
end;
$$;

revoke all on function app_private.initialize_website_access_draft_fields() from public;

create or replace function app_private.set_website_access_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.draft_event_slug is distinct from old.draft_event_slug
     or new.draft_visibility is distinct from old.draft_visibility then
    new.website_access_updated_at = timezone('utc', now());
  end if;

  return new;
end;
$$;

revoke all on function app_private.set_website_access_updated_at() from public;

create or replace function app_private.prevent_event_slug_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.event_slug is distinct from old.event_slug then
    if not (
      new.status = 'published'
      and new.published_at is not null
      and new.draft_event_slug = new.event_slug
    ) then
      raise exception 'event_slug can only change when publishing the current draft slug';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function app_private.prevent_event_slug_update() from public;

drop trigger if exists initialize_rsvp_events_website_access_draft_fields on public.rsvp_events;

create trigger initialize_rsvp_events_website_access_draft_fields
before insert on public.rsvp_events
for each row
execute function app_private.initialize_website_access_draft_fields();

drop trigger if exists set_rsvp_events_website_access_updated_at on public.rsvp_events;

create trigger set_rsvp_events_website_access_updated_at
before update of draft_event_slug, draft_visibility on public.rsvp_events
for each row
execute function app_private.set_website_access_updated_at();
