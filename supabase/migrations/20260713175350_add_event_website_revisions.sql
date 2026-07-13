alter table public.event_content
add column if not exists saved_revision bigint not null default 0;

alter table public.event_content
add column if not exists published_revision bigint not null default 0;

alter table public.event_content
add column if not exists saved_at timestamptz;

update public.event_content
set
  published_revision = case
    when published_content_json is null then 0
    else 1
  end,
  saved_revision = case
    when content_json = '{}'::jsonb then 0
    when published_content_json is null then 1
    when pg_input_is_valid(content_json #>> '{meta,savedAt}', 'timestamp with time zone')
      and (content_json #>> '{meta,savedAt}')::timestamptz > published_at then 2
    else 1
  end,
  saved_at = case
    when pg_input_is_valid(content_json #>> '{meta,savedAt}', 'timestamp with time zone')
      then (content_json #>> '{meta,savedAt}')::timestamptz
    else updated_at
  end
where saved_revision = 0
  and published_revision = 0;

alter table public.event_content
drop constraint if exists event_content_revision_order_check;

alter table public.event_content
add constraint event_content_revision_order_check
check (
  saved_revision >= 0
  and published_revision >= 0
  and published_revision <= saved_revision
);

comment on column public.event_content.saved_revision is
  'Monotonic revision of the complete saved Event Website draft.';

comment on column public.event_content.published_revision is
  'Saved draft revision copied into published_content_json.';

comment on column public.event_content.saved_at is
  'Database commit timestamp for the latest complete Event Website draft.';

create or replace function public.save_event_website_draft_revision(
  p_event_id uuid,
  p_client_id uuid,
  p_actor_user_id uuid,
  p_content jsonb,
  p_canonical_event_patch jsonb,
  p_expected_revision bigint,
  p_client_sequence bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_content_id uuid;
  v_current_revision bigint;
  v_saved_at timestamptz := statement_timestamp();
  v_committed_content jsonb;
begin
  if jsonb_typeof(p_content) is distinct from 'object' then
    raise exception using errcode = '22023', message = 'Event Website content must be an object.';
  end if;

  if p_expected_revision < 0 or p_client_sequence < 0 then
    raise exception using errcode = '22023', message = 'Revision values must be non-negative.';
  end if;

  if not exists (
    select 1
    from public.profiles as profile
    where profile.id = p_actor_user_id
      and profile.client_id = p_client_id
      and profile.is_active is true
      and profile.role in ('client_owner', 'client_staff')
  ) then
    raise exception using errcode = '42501', message = 'The draft actor is not an active tenant member.';
  end if;

  perform 1
  from public.rsvp_events as event
  where event.id = p_event_id
    and event.client_id = p_client_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'The Event Website record was not found.';
  end if;

  insert into public.event_content (event_id, content_json, saved_revision, saved_at)
  values (p_event_id, '{}'::jsonb, 0, null)
  on conflict (event_id) do nothing;

  select content.id, content.saved_revision
  into v_content_id, v_current_revision
  from public.event_content as content
  where content.event_id = p_event_id
  for update;

  if v_current_revision <> p_expected_revision then
    return jsonb_build_object(
      'status', 'conflict',
      'eventId', p_event_id,
      'clientSequence', p_client_sequence,
      'serverRevision', v_current_revision
    );
  end if;

  v_committed_content := p_content || jsonb_build_object(
    'meta', coalesce(p_content -> 'meta', '{}'::jsonb) || jsonb_build_object(
      'savedAt', v_saved_at,
      'savedBy', p_actor_user_id
    )
  );

  update public.event_content
  set
    content_json = v_committed_content,
    saved_revision = v_current_revision + 1,
    saved_at = v_saved_at
  where id = v_content_id;

  update public.rsvp_events
  set
    event_date = nullif(p_canonical_event_patch ->> 'event_date', '')::date,
    event_time = nullif(p_canonical_event_patch ->> 'event_time', '')::time,
    rsvp_close_at = nullif(p_canonical_event_patch ->> 'rsvp_close_at', '')::timestamptz,
    venue_address = nullif(p_canonical_event_patch ->> 'venue_address', ''),
    venue_name = nullif(p_canonical_event_patch ->> 'venue_name', '')
  where id = p_event_id
    and client_id = p_client_id;

  insert into public.audit_logs (
    actor_user_id,
    client_id,
    event_id,
    entity_type,
    entity_id,
    action,
    metadata
  ) values (
    p_actor_user_id,
    p_client_id,
    p_event_id,
    'event_content',
    v_content_id,
    'event_website_draft_saved',
    jsonb_build_object(
      'client_sequence', p_client_sequence,
      'previous_revision', v_current_revision,
      'saved_revision', v_current_revision + 1
    )
  );

  return jsonb_build_object(
    'status', 'saved',
    'eventId', p_event_id,
    'contentId', v_content_id,
    'content', v_committed_content,
    'clientSequence', p_client_sequence,
    'savedRevision', v_current_revision + 1,
    'savedAt', v_saved_at
  );
end;
$$;

comment on function public.save_event_website_draft_revision(uuid, uuid, uuid, jsonb, jsonb, bigint, bigint) is
  'Atomically saves one complete Event Website draft using optimistic concurrency.';

create or replace function public.publish_event_website_revision(
  p_event_id uuid,
  p_client_id uuid,
  p_actor_user_id uuid,
  p_expected_saved_revision bigint,
  p_private_access_token text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_content public.event_content%rowtype;
  v_event public.rsvp_events%rowtype;
  v_published_at timestamptz := statement_timestamp();
begin
  if not exists (
    select 1
    from public.profiles as profile
    where profile.id = p_actor_user_id
      and profile.client_id = p_client_id
      and profile.is_active is true
      and profile.role in ('client_owner', 'client_staff')
  ) then
    raise exception using errcode = '42501', message = 'The publish actor is not an active tenant member.';
  end if;

  select event.*
  into v_event
  from public.rsvp_events as event
  where event.id = p_event_id
    and event.client_id = p_client_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'The Event Website record was not found.';
  end if;

  select content.*
  into v_content
  from public.event_content as content
  where content.event_id = p_event_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'The Event Website draft content is missing.';
  end if;

  if v_content.saved_revision <> p_expected_saved_revision then
    return jsonb_build_object(
      'status', 'conflict',
      'eventId', p_event_id,
      'serverRevision', v_content.saved_revision
    );
  end if;

  update public.event_content
  set
    published_at = v_published_at,
    published_by = p_actor_user_id,
    published_content_json = v_content.content_json,
    published_revision = v_content.saved_revision
  where id = v_content.id;

  update public.rsvp_events
  set
    event_slug = v_event.draft_event_slug,
    subdomain_slug = v_event.draft_subdomain_slug,
    visibility = v_event.draft_visibility,
    status = 'published',
    published_at = v_published_at,
    private_access_token = case
      when v_event.draft_visibility = 'private'
        then coalesce(nullif(p_private_access_token, ''), v_event.private_access_token)
      else v_event.private_access_token
    end
  where id = p_event_id
    and client_id = p_client_id;

  insert into public.audit_logs (
    actor_user_id,
    client_id,
    event_id,
    entity_type,
    entity_id,
    action,
    metadata
  ) values (
    p_actor_user_id,
    p_client_id,
    p_event_id,
    'event_content',
    v_content.id,
    'event_website_published',
    jsonb_build_object(
      'previous_published_revision', v_content.published_revision,
      'published_revision', v_content.saved_revision,
      'previous_slug', v_event.event_slug,
      'next_slug', v_event.draft_event_slug,
      'previous_visibility', v_event.visibility,
      'next_visibility', v_event.draft_visibility
    )
  );

  return jsonb_build_object(
    'status', 'published',
    'eventId', p_event_id,
    'previousPublishedSlug', case when v_event.published_at is null then null else v_event.event_slug end,
    'previousPublishedSubdomain', case when v_event.published_at is null then null else v_event.subdomain_slug end,
    'publishedAt', v_published_at,
    'publishedRevision', v_content.saved_revision,
    'publishedSlug', v_event.draft_event_slug,
    'publishedSubdomain', v_event.draft_subdomain_slug,
    'publishedVisibility', v_event.draft_visibility
  );
end;
$$;

comment on function public.publish_event_website_revision(uuid, uuid, uuid, bigint, text) is
  'Atomically publishes the exact saved Event Website revision and matching access state.';

revoke all on function public.save_event_website_draft_revision(uuid, uuid, uuid, jsonb, jsonb, bigint, bigint)
from public, anon, authenticated;
revoke all on function public.publish_event_website_revision(uuid, uuid, uuid, bigint, text)
from public, anon, authenticated;

grant execute on function public.save_event_website_draft_revision(uuid, uuid, uuid, jsonb, jsonb, bigint, bigint)
to service_role;
grant execute on function public.publish_event_website_revision(uuid, uuid, uuid, bigint, text)
to service_role;
