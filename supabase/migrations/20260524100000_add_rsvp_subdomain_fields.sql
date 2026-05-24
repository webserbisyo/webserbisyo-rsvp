alter table public.rsvp_events
add column if not exists draft_subdomain_slug text;

alter table public.rsvp_events
add column if not exists subdomain_slug text;

update public.rsvp_events
set
  draft_subdomain_slug = coalesce(draft_subdomain_slug, draft_event_slug, event_slug),
  subdomain_slug = coalesce(
    subdomain_slug,
    case
      when published_at is not null or status = 'published' then event_slug
      else null
    end
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rsvp_events_draft_subdomain_slug_format_check'
      and conrelid = 'public.rsvp_events'::regclass
  ) then
    alter table public.rsvp_events
    add constraint rsvp_events_draft_subdomain_slug_format_check
    check (
      draft_subdomain_slug is null
      or (
        char_length(draft_subdomain_slug) between 3 and 63
        and draft_subdomain_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
      )
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rsvp_events_subdomain_slug_format_check'
      and conrelid = 'public.rsvp_events'::regclass
  ) then
    alter table public.rsvp_events
    add constraint rsvp_events_subdomain_slug_format_check
    check (
      subdomain_slug is null
      or (
        char_length(subdomain_slug) between 3 and 63
        and subdomain_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
      )
    );
  end if;
end
$$;

create unique index if not exists idx_rsvp_events_subdomain_slug_unique
on public.rsvp_events (subdomain_slug)
where subdomain_slug is not null;

create unique index if not exists idx_rsvp_events_draft_subdomain_slug_unique
on public.rsvp_events (draft_subdomain_slug)
where draft_subdomain_slug is not null;

create or replace function app_private.initialize_website_access_draft_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.draft_event_slug = coalesce(new.draft_event_slug, new.event_slug);
  new.draft_subdomain_slug = coalesce(new.draft_subdomain_slug, new.draft_event_slug, new.event_slug);
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
     or new.draft_subdomain_slug is distinct from old.draft_subdomain_slug
     or new.draft_visibility is distinct from old.draft_visibility then
    new.website_access_updated_at = timezone('utc', now());
  end if;

  return new;
end;
$$;

revoke all on function app_private.set_website_access_updated_at() from public;

drop trigger if exists set_rsvp_events_website_access_updated_at on public.rsvp_events;

create trigger set_rsvp_events_website_access_updated_at
before update of draft_event_slug, draft_subdomain_slug, draft_visibility on public.rsvp_events
for each row
execute function app_private.set_website_access_updated_at();
