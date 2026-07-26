-- Phase 1 security hardening.
--
-- Preconditions:
--   * The three existing public functions named below must exist with the
--     signatures used by the deployed application.
--   * profiles.client_id, profiles.role, profiles.is_active, and clients.status
--     must exist.
--   * Client statuses must remain inside the currently deployed lifecycle set.
--
-- Forward behavior:
--   * archived/cancelled clients no longer resolve a tenant identity through
--     app_private helpers; active/paused/expired retain their existing access
--     semantics.
--   * RSVP capacity functions are callable only by service_role. Public guest
--     submissions continue through the validated Next.js server endpoint.
--   * Both capacity functions validate event/client relationships and use a
--     fixed search_path.
--   * rls_auto_enable remains available to its owning event trigger but is no
--     longer exposed to API roles.
--
-- Verification queries (run after apply):
--   select has_function_privilege('anon',
--     'public.submit_rsvp_response_with_capacity_check(uuid,uuid,text,text,text,text,integer,text,text,text,text)',
--     'execute');
--   select has_function_privilege('authenticated',
--     'public.approve_rsvp_response_with_capacity_check(uuid,uuid)', 'execute');
--   select has_function_privilege('service_role',
--     'public.approve_rsvp_response_with_capacity_check(uuid,uuid)', 'execute');
--   select proconfig, prosecdef from pg_proc
--     where oid = 'public.approve_rsvp_response_with_capacity_check(uuid,uuid)'::regprocedure;
--   select pg_get_functiondef('app_private.current_client_id()'::regprocedure);
--
-- Rollback considerations:
--   Do not restore public/anon/authenticated EXECUTE grants. If an application
--   regression is found, correct the server caller or issue a forward migration.
--   Do not remove the archived/cancelled checks merely to restore access; use
--   the explicit client restore lifecycle action instead.

do $preconditions$
begin
  if to_regprocedure(
    'public.submit_rsvp_response_with_capacity_check(uuid,uuid,text,text,text,text,integer,text,text,text,text)'
  ) is null then
    raise exception 'Missing submit_rsvp_response_with_capacity_check function';
  end if;

  if to_regprocedure(
    'public.approve_rsvp_response_with_capacity_check(uuid,uuid)'
  ) is null then
    raise exception 'Missing approve_rsvp_response_with_capacity_check function';
  end if;

  if to_regprocedure('public.rls_auto_enable()') is null then
    raise exception 'Missing rls_auto_enable function';
  end if;

  if exists (
    select 1
    from public.clients
    where status not in ('active', 'paused', 'expired', 'archived', 'cancelled')
  ) then
    raise exception 'Unexpected client status found; review access semantics before applying';
  end if;
end
$preconditions$;

create or replace function app_private.current_profile_role()
returns text
language sql
stable
security definer
set search_path = ''
as $function$
  select p.role
  from public.profiles as p
  left join public.clients as c on c.id = p.client_id
  where p.id = auth.uid()
    and p.is_active is true
    and (
      p.role not in ('client_owner', 'client_staff')
      or (
        p.client_id is not null
        and c.status in ('active', 'paused', 'expired')
      )
    )
  limit 1
$function$;

create or replace function app_private.current_client_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $function$
  select p.client_id
  from public.profiles as p
  join public.clients as c on c.id = p.client_id
  where p.id = auth.uid()
    and p.is_active is true
    and p.role in ('client_owner', 'client_staff')
    and c.status in ('active', 'paused', 'expired')
  limit 1
$function$;

revoke all on function app_private.current_profile_role() from public;
revoke all on function app_private.current_profile_role() from anon;
revoke all on function app_private.current_profile_role() from service_role;
grant execute on function app_private.current_profile_role() to authenticated;

revoke all on function app_private.current_client_id() from public;
revoke all on function app_private.current_client_id() from anon;
revoke all on function app_private.current_client_id() from service_role;
grant execute on function app_private.current_client_id() to authenticated;

create or replace function public.submit_rsvp_response_with_capacity_check(
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
  p_source text
)
returns public.rsvp_responses
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_max_guest_count integer;
  v_current_total integer;
  v_new_response public.rsvp_responses;
begin
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
    review_status
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
    'approved'
  )
  returning * into v_new_response;

  return v_new_response;
end
$function$;

revoke all on function public.submit_rsvp_response_with_capacity_check(
  uuid, uuid, text, text, text, text, integer, text, text, text, text
) from public;
revoke all on function public.submit_rsvp_response_with_capacity_check(
  uuid, uuid, text, text, text, text, integer, text, text, text, text
) from anon;
revoke all on function public.submit_rsvp_response_with_capacity_check(
  uuid, uuid, text, text, text, text, integer, text, text, text, text
) from authenticated;
grant execute on function public.submit_rsvp_response_with_capacity_check(
  uuid, uuid, text, text, text, text, integer, text, text, text, text
) to service_role;

create or replace function public.approve_rsvp_response_with_capacity_check(
  p_response_id uuid,
  p_client_id uuid
)
returns public.rsvp_responses
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_max_guest_count integer;
  v_current_total integer;
  v_response public.rsvp_responses;
begin
  select r.*
    into v_response
  from public.rsvp_responses as r
  join public.rsvp_events as e
    on e.id = r.event_id
   and e.client_id = r.client_id
  where r.id = p_response_id
    and r.client_id = p_client_id
    and e.client_id = p_client_id
  for update of r;

  if not found then
    raise exception 'RESPONSE_NOT_FOUND';
  end if;

  if v_response.review_status = 'approved' then
    return v_response;
  end if;

  select coalesce(e.max_guest_count, 1000)
    into v_max_guest_count
  from public.rsvp_events as e
  where e.id = v_response.event_id
    and e.client_id = p_client_id
  for update;

  if not found then
    raise exception 'EVENT_CLIENT_MISMATCH';
  end if;

  if v_response.attendance_status = 'attending' then
    select coalesce(sum(r.party_size), 0)
      into v_current_total
    from public.rsvp_responses as r
    where r.event_id = v_response.event_id
      and r.client_id = p_client_id
      and r.attendance_status = 'attending'
      and r.review_status = 'approved'
      and r.archived_at is null;

    if v_current_total + v_response.party_size > v_max_guest_count then
      raise exception 'CAPACITY_EXCEEDED';
    end if;
  end if;

  update public.rsvp_responses
  set review_status = 'approved',
      updated_at = timezone('utc', now())
  where id = p_response_id
    and client_id = p_client_id
    and event_id = v_response.event_id
  returning * into v_response;

  return v_response;
end
$function$;

revoke all on function public.approve_rsvp_response_with_capacity_check(uuid, uuid) from public;
revoke all on function public.approve_rsvp_response_with_capacity_check(uuid, uuid) from anon;
revoke all on function public.approve_rsvp_response_with_capacity_check(uuid, uuid)
  from authenticated;
grant execute on function public.approve_rsvp_response_with_capacity_check(uuid, uuid)
  to service_role;

revoke all on function public.rls_auto_enable() from public;
revoke all on function public.rls_auto_enable() from anon;
revoke all on function public.rls_auto_enable() from authenticated;
revoke all on function public.rls_auto_enable() from service_role;
