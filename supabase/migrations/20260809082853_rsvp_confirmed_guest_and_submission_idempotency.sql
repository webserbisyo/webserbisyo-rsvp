-- Host-controlled final guest-list state and transport-level RSVP idempotency.
-- This migration is additive: existing RSVP rows remain intact and default to pending.

alter table public.rsvp_responses
  add column host_confirmation_status text not null default 'pending',
  add column host_confirmed_at timestamptz,
  add column host_confirmed_by uuid references public.profiles (id) on delete set null,
  add column submission_id uuid;

alter table public.rsvp_responses
  add constraint rsvp_responses_host_confirmation_status_check
    check (host_confirmation_status in ('pending', 'confirmed')),
  add constraint rsvp_responses_host_confirmation_audit_check
    check (
      (host_confirmation_status = 'pending'
        and host_confirmed_at is null
        and host_confirmed_by is null)
      or
      (host_confirmation_status = 'confirmed'
        and host_confirmed_at is not null)
    ),
  add constraint rsvp_responses_confirmed_guest_state_check
    check (
      host_confirmation_status <> 'confirmed'
      or (
        attendance_status = 'attending'
        and review_status = 'approved'
        and archived_at is null
      )
    );

create unique index rsvp_responses_event_submission_id_key
  on public.rsvp_responses (event_id, submission_id)
  where submission_id is not null;

comment on column public.rsvp_responses.host_confirmation_status is
  'Host-controlled final guest-list decision. Independent from response and Guestbook moderation.';

comment on column public.rsvp_responses.submission_id is
  'Client-generated transport idempotency key. It is not guest identity.';

-- Keep the existing submit function for already-deployed callers. New first-party callers use
-- this versioned function, which persists the response and companions in one transaction.
create or replace function public.submit_rsvp_response_with_capacity_check_v2(
  p_event_id uuid,
  p_client_id uuid,
  p_guest_name text,
  p_email text,
  p_phone text,
  p_attendance_status text,
  p_party_size integer,
  p_dietary_notes text,
  p_message text,
  p_message_public_status text,
  p_source text,
  p_submission_id uuid,
  p_companions jsonb default '[]'::jsonb
)
returns table (response_id uuid, created boolean)
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_max_guest_count integer;
  v_current_total integer;
  v_response_id uuid;
begin
  if jsonb_typeof(coalesce(p_companions, '[]'::jsonb)) <> 'array' then
    raise exception 'INVALID_COMPANIONS';
  end if;

  -- A completed prior request may be replayed even after the RSVP window closes.
  select r.id
    into v_response_id
  from public.rsvp_responses as r
  where r.event_id = p_event_id
    and r.submission_id = p_submission_id;

  if found then
    response_id := v_response_id;
    created := false;
    return next;
    return;
  end if;

  -- Serializing on the event row protects capacity and closes the concurrent retry race.
  select coalesce(e.max_guest_count, 1000)
    into v_max_guest_count
  from public.rsvp_events as e
  where e.id = p_event_id
    and e.client_id = p_client_id
    and e.status = 'published'
    and e.published_at is not null
    and e.archived_at is null
    and e.fallback_page_enabled is true
    and (e.rsvp_open_at is null or e.rsvp_open_at <= timezone('utc', now()))
    and (e.rsvp_close_at is null or e.rsvp_close_at >= timezone('utc', now()))
  for update;

  if not found then
    raise exception 'RSVP_NOT_AVAILABLE';
  end if;

  -- Recheck after acquiring the event lock so concurrent retries cannot both insert.
  select r.id
    into v_response_id
  from public.rsvp_responses as r
  where r.event_id = p_event_id
    and r.submission_id = p_submission_id;

  if found then
    response_id := v_response_id;
    created := false;
    return next;
    return;
  end if;

  if p_attendance_status = 'attending' then
    select coalesce(sum(r.party_size), 0)
      into v_current_total
    from public.rsvp_responses as r
    where r.event_id = p_event_id
      and r.client_id = p_client_id
      and r.attendance_status = 'attending'
      and r.review_status = 'approved'
      and r.archived_at is null;

    if v_current_total + p_party_size > v_max_guest_count then
      raise exception 'CAPACITY_EXCEEDED';
    end if;
  end if;

  insert into public.rsvp_responses (
    event_id,
    client_id,
    guest_name,
    email,
    phone,
    attendance_status,
    party_size,
    dietary_notes,
    message,
    message_public_status,
    source,
    review_status,
    submission_id
  )
  values (
    p_event_id,
    p_client_id,
    p_guest_name,
    p_email,
    p_phone,
    p_attendance_status,
    p_party_size,
    p_dietary_notes,
    p_message,
    p_message_public_status,
    p_source,
    'approved',
    p_submission_id
  )
  returning id into v_response_id;

  insert into public.rsvp_response_companions (response_id, full_name, age_label)
  select
    v_response_id,
    companion.full_name,
    companion.age_label
  from jsonb_to_recordset(coalesce(p_companions, '[]'::jsonb))
    as companion(full_name text, age_label text);

  response_id := v_response_id;
  created := true;
  return next;
end
$function$;

revoke all on function public.submit_rsvp_response_with_capacity_check_v2(
  uuid, uuid, text, text, text, text, integer, text, text, text, text, uuid, jsonb
) from public;
revoke all on function public.submit_rsvp_response_with_capacity_check_v2(
  uuid, uuid, text, text, text, text, integer, text, text, text, text, uuid, jsonb
) from anon;
revoke all on function public.submit_rsvp_response_with_capacity_check_v2(
  uuid, uuid, text, text, text, text, integer, text, text, text, text, uuid, jsonb
) from authenticated;
grant execute on function public.submit_rsvp_response_with_capacity_check_v2(
  uuid, uuid, text, text, text, text, integer, text, text, text, text, uuid, jsonb
) to service_role;
