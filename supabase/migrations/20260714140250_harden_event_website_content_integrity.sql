create or replace function app_private.event_website_content_structure_is_valid(
  p_content jsonb
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    jsonb_typeof(p_content) = 'object'
    and jsonb_typeof(p_content -> 'sections') = 'object'
    and not exists (
      select 1
      from jsonb_each(coalesce(p_content -> 'sections', '{}'::jsonb)) as section_entry
      where jsonb_typeof(section_entry.value) = 'object'
        and section_entry.value ? 'enabled'
    )
    and jsonb_typeof(p_content #> '{layout,enabledSections}') = 'object'
    and not exists (
      select 1
      from jsonb_each(coalesce(p_content #> '{layout,enabledSections}', '{}'::jsonb)) as visibility
      where jsonb_typeof(visibility.value) <> 'boolean'
    )
    and not exists (
      select 1
      from jsonb_object_keys(
        coalesce(p_content #> '{layout,enabledSections}', '{}'::jsonb)
      ) as visibility_key
      where visibility_key not in (
        'host_info',
        'countdown',
        'music_effects',
        'main_event',
        'venue',
        'secondary_event',
        'timeline_program',
        'entourage',
        'principal_sponsors',
        'attire_motif',
        'extra_info',
        'rsvp_form',
        'gift_details',
        'guestbook',
        'story_message',
        'contact_socials'
      )
    )
    and p_content #> '{layout,enabledSections,host_info}' = 'true'::jsonb
    and p_content #> '{layout,enabledSections,main_event}' = 'true'::jsonb
    and p_content #> '{layout,enabledSections,venue}' = 'true'::jsonb
    and p_content #> '{layout,enabledSections,rsvp_form}' = 'true'::jsonb;
$$;

comment on function app_private.event_website_content_structure_is_valid(jsonb) is
  'Validates the canonical location and key set for Event Website section visibility.';

revoke all on function app_private.event_website_content_structure_is_valid(jsonb)
from public, anon, authenticated;

create or replace function app_private.enforce_event_website_content_structure()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.content_json <> '{}'::jsonb
    and not app_private.event_website_content_structure_is_valid(new.content_json) then
    raise exception using
      errcode = '22023',
      message = 'invalid event website content structure';
  end if;

  if new.published_content_json is not null
    and not app_private.event_website_content_structure_is_valid(new.published_content_json) then
    raise exception using
      errcode = '22023',
      message = 'invalid published event website content structure';
  end if;

  return new;
end;
$$;

comment on function app_private.enforce_event_website_content_structure() is
  'Rejects malformed Event Website snapshots at every database write boundary, including revision RPCs.';

revoke all on function app_private.enforce_event_website_content_structure()
from public, anon, authenticated;

drop trigger if exists enforce_event_website_content_structure on public.event_content;

create trigger enforce_event_website_content_structure
before insert or update of content_json, published_content_json
on public.event_content
for each row
execute function app_private.enforce_event_website_content_structure();

alter table public.event_content
drop constraint if exists event_content_content_structure_check;

alter table public.event_content
add constraint event_content_content_structure_check
check (
  (content_json = '{}'::jsonb or app_private.event_website_content_structure_is_valid(content_json))
  and (
    published_content_json is null
    or app_private.event_website_content_structure_is_valid(published_content_json)
  )
);

update public.client_custom_websites
set last_health_status = 'frontend_unreachable'
where last_health_status = 'unhealthy';

alter table public.client_custom_websites
drop constraint if exists client_custom_websites_last_health_status_check;

alter table public.client_custom_websites
add constraint client_custom_websites_last_health_status_check
check (
  last_health_status in (
    'unknown',
    'healthy',
    'frontend_unreachable',
    'event_not_found',
    'event_content_invalid',
    'preview_misconfigured',
    'contract_invalid'
  )
);
