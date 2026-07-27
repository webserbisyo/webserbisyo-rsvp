-- Atomic PL/pgSQL RPC for Application Provisioning
-- Ensures all public-table writes (client, event, content, profile, application update, audit log) execute inside a single transaction.

create or replace function app_private.provision_application_atomic(
  p_application_id uuid,
  p_auth_user_id uuid,
  p_actor_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_app record;
  v_client record;
  v_event record;
  v_profile record;
  v_now timestamptz := now();
  v_normalized_email text;
  v_slug text;
  v_title text;
begin
  -- 1. Lock application row and verify status
  select * into v_app
  from public.rsvp_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Application not found';
  end if;

  v_normalized_email := lower(trim(v_app.email));

  if v_app.status not in ('submitted', 'reviewing', 'approved') then
    raise exception 'Cannot approve application in current status';
  end if;

  -- 2. Find or create Client
  if v_app.approved_client_id is not null then
    select * into v_client from public.clients where id = v_app.approved_client_id;
  else
    select * into v_client from public.clients where lower(contact_email) = v_normalized_email limit 1;
  end if;

  if v_client.id is null then
    insert into public.clients (
      name, contact_name, contact_email, contact_phone, status, plan_type, payment_status, created_at, updated_at
    ) values (
      v_app.full_name, v_app.full_name, v_normalized_email, v_app.phone, 'active', v_app.preferred_plan, 'pending', v_now, v_now
    ) returning * into v_client;
  end if;

  -- 3. Find or create Event
  if v_app.approved_event_id is not null then
    select * into v_event from public.rsvp_events where id = v_app.approved_event_id;
  else
    select * into v_event from public.rsvp_events where client_id = v_client.id and status != 'archived' order by created_at desc limit 1;
  end if;

  if v_event.id is null then
    v_slug := lower(regexp_replace(v_app.full_name || '-' || v_app.event_type || '-' || coalesce(v_app.reference_code, 'r'), '[^a-zA-Z0-9]+', '-', 'g'));
    v_title := v_app.full_name || ' RSVP';
    
    insert into public.rsvp_events (
      client_id, title, event_type, event_date, event_location, event_slug, status, max_guest_count, created_at, updated_at
    ) values (
      v_client.id, v_title, v_app.event_type, v_app.event_date, v_app.event_location, v_slug, 'draft', coalesce(v_app.estimated_guest_count, 100), v_now, v_now
    ) returning * into v_event;

    insert into public.event_content (event_id, hero_title, content_json, created_at, updated_at)
    values (v_event.id, v_title, '{}'::jsonb, v_now, v_now)
    on conflict (event_id) do nothing;
  end if;

  -- 4. Find or create Client Owner Profile
  select * into v_profile from public.profiles where id = p_auth_user_id;

  if v_profile.id is null then
    insert into public.profiles (
      id, email, full_name, role, client_id, is_active, created_at, updated_at
    ) values (
      p_auth_user_id, v_normalized_email, v_app.full_name, 'client_owner', v_client.id, true, v_now, v_now
    ) returning * into v_profile;
  else
    if v_profile.client_id != v_client.id or v_profile.role != 'client_owner' then
      raise exception 'Profile is linked to a different client or role';
    end if;
  end if;

  -- 5. Update Application to approved and store canonical links
  update public.rsvp_applications
  set approved_at = coalesce(approved_at, v_now),
      approved_client_id = v_client.id,
      approved_event_id = v_event.id,
      reviewed_at = v_now,
      status = 'approved',
      updated_at = v_now
  where id = v_app.id;

  -- 6. Write Audit Log
  insert into public.audit_logs (
    actor_user_id, action, entity_type, entity_id, client_id, event_id, metadata, created_at
  ) values (
    p_actor_user_id, 'client_provisioning_completed', 'rsvp_applications', v_app.id, v_client.id, v_event.id,
    jsonb_build_object('application_id', v_app.id, 'profile_id', v_profile.id), v_now
  );

  return jsonb_build_object(
    'client_id', v_client.id,
    'event_id', v_event.id,
    'profile_id', v_profile.id,
    'status', 'approved'
  );
end;
$function$;

revoke all on function app_private.provision_application_atomic(uuid, uuid, uuid) from public;
grant execute on function app_private.provision_application_atomic(uuid, uuid, uuid) to service_role;
