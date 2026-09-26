-- Migration: 20260926160000_cascade_purge_applications_and_orphans.sql
-- 1. Grant delete permissions to service_role on rsvp_applications and email_logs
grant delete on table public.rsvp_applications to service_role;
grant delete on table public.email_logs to service_role;
grant delete on table public.email_logs to authenticated;

-- 2. Update admin_purge_client_permanently to cascade delete rsvp_applications
-- matching approved_client_id, approved_event_id, or client contact_email.
create or replace function public.admin_purge_client_permanently(
  p_client_id uuid,
  p_profile_ids uuid[] default '{}'::uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_application_ids uuid[] := '{}'::uuid[];
  v_audit_logs integer := 0;
  v_client_rows integer := 0;
  v_custom_websites integer := 0;
  v_email_logs integer := 0;
  v_event_content integer := 0;
  v_event_ids uuid[] := '{}'::uuid[];
  v_events integer := 0;
  v_meta_pixels integer := 0;
  v_notification_preferences integer := 0;
  v_payment_ids uuid[] := '{}'::uuid[];
  v_payment_refunds integer := 0;
  v_payments integer := 0;
  v_profile_ids uuid[] := '{}'::uuid[];
  v_push_subscriptions integer := 0;
  v_response_ids uuid[] := '{}'::uuid[];
  v_responses integer := 0;
  v_tombstones integer := 0;
  v_contact_email text;
begin
  select contact_email
  into v_contact_email
  from public.clients as c
  where c.id = p_client_id
  for update;

  if not found then
    return jsonb_build_object(
      'client_id', p_client_id,
      'deleted', false,
      'status', 'not_found',
      'deleted_row_counts', '{}'::jsonb
    );
  end if;

  select coalesce(array_agg(e.id order by e.id), '{}'::uuid[])
  into v_event_ids
  from public.rsvp_events as e
  where e.client_id = p_client_id;

  select coalesce(array_agg(a.id order by a.id), '{}'::uuid[])
  into v_application_ids
  from public.rsvp_applications as a
  where a.approved_client_id = p_client_id
     or a.approved_event_id = any(v_event_ids)
     or (v_contact_email is not null and lower(trim(a.email)) = lower(trim(v_contact_email)));

  select coalesce(array_agg(p.id order by p.id), '{}'::uuid[])
  into v_payment_ids
  from public.payments as p
  where p.client_id = p_client_id
     or p.event_id = any(v_event_ids)
     or p.application_id = any(v_application_ids);

  select coalesce(array_agg(r.id order by r.id), '{}'::uuid[])
  into v_response_ids
  from public.rsvp_responses as r
  where r.client_id = p_client_id
     or r.event_id = any(v_event_ids);

  select coalesce(array_agg(distinct profile_id order by profile_id), '{}'::uuid[])
  into v_profile_ids
  from unnest(coalesce(p_profile_ids, '{}'::uuid[])) as profile_id;

  if exists (
    select 1 from public.profiles as p where p.client_id = p_client_id
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'database_purge: linked profiles remain after Auth deletion';
  end if;

  delete from public.rsvp_responses as r
  where r.client_id = p_client_id
     or r.event_id = any(v_event_ids);
  get diagnostics v_responses = row_count;

  delete from public.meta_pixels as m
  where m.client_id = p_client_id
     or m.event_id = any(v_event_ids);
  get diagnostics v_meta_pixels = row_count;

  delete from public.payment_refunds as pr
  where pr.client_id = p_client_id
     or pr.payment_id = any(v_payment_ids);
  get diagnostics v_payment_refunds = row_count;

  delete from public.email_logs as el
  where el.client_id = p_client_id
     or el.event_id = any(v_event_ids)
     or el.application_id = any(v_application_ids);
  get diagnostics v_email_logs = row_count;

  delete from public.client_custom_websites as cw
  where cw.client_id = p_client_id
     or cw.event_id = any(v_event_ids);
  get diagnostics v_custom_websites = row_count;

  delete from public.event_content as ec
  where ec.event_id = any(v_event_ids);
  get diagnostics v_event_content = row_count;

  delete from public.payments as p
  where p.id = any(v_payment_ids);
  get diagnostics v_payments = row_count;

  delete from public.rsvp_applications as a
  where a.id = any(v_application_ids);

  delete from public.client_deletion_tombstones as t
  where t.original_client_id = p_client_id
     or t.event_id = any(v_event_ids)
     or exists (
       select 1
       from jsonb_path_query(t.metadata, '$.**') as value
       where value = to_jsonb(p_client_id::text)
          or value = any(
            select to_jsonb(event_id::text) from unnest(v_event_ids) as event_id
          )
     );
  get diagnostics v_tombstones = row_count;

  perform set_config('app.permanent_client_purge', 'on', true);

  delete from public.audit_logs as al
  where al.client_id = p_client_id
     or al.event_id = any(v_event_ids)
     or al.actor_user_id = any(v_profile_ids)
     or al.entity_id = p_client_id
     or al.entity_id = any(v_event_ids)
     or al.entity_id = any(v_application_ids)
     or al.entity_id = any(v_payment_ids)
     or al.entity_id = any(v_response_ids)
     or al.entity_id = any(v_profile_ids)
     or exists (
       select 1
       from jsonb_path_query(al.metadata, '$.**') as value
       where value = to_jsonb(p_client_id::text)
          or value = any(
            select to_jsonb(target_id::text)
            from unnest(
              v_event_ids || v_application_ids || v_payment_ids || v_response_ids || v_profile_ids
            ) as target_id
          )
     );
  get diagnostics v_audit_logs = row_count;

  delete from public.rsvp_events as e
  where e.id = any(v_event_ids);
  get diagnostics v_events = row_count;

  delete from public.notification_preferences as np
  where np.client_id = p_client_id;
  get diagnostics v_notification_preferences = row_count;

  delete from public.push_subscriptions as ps
  where ps.client_id = p_client_id;
  get diagnostics v_push_subscriptions = row_count;

  delete from public.clients as c
  where c.id = p_client_id;
  get diagnostics v_client_rows = row_count;

  if v_client_rows <> 1 then
    raise exception using
      errcode = 'P0001',
      message = 'database_purge: client row was not deleted';
  end if;

  return jsonb_build_object(
    'client_id', p_client_id,
    'deleted', true,
    'status', 'deleted',
    'deleted_row_counts', jsonb_build_object(
      'audit_logs', v_audit_logs,
      'client_custom_websites', v_custom_websites,
      'client_rows', v_client_rows,
      'email_logs', v_email_logs,
      'event_content', v_event_content,
      'meta_pixels', v_meta_pixels,
      'notification_preferences', v_notification_preferences,
      'payment_refunds', v_payment_refunds,
      'payments', v_payments,
      'push_subscriptions', v_push_subscriptions,
      'responses', v_responses,
      'rsvp_events', v_events,
      'tombstones', v_tombstones
    )
  );
end;
$$;

-- 3. Atomic function to purge orphaned applications (approved without active client)
create or replace function public.admin_purge_orphaned_applications(
  p_application_ids uuid[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target_app_ids uuid[] := '{}'::uuid[];
  v_target_payment_ids uuid[] := '{}'::uuid[];
  v_purged_apps integer := 0;
  v_purged_payments integer := 0;
  v_purged_emails integer := 0;
begin
  select coalesce(array_agg(a.id order by a.id), '{}'::uuid[])
  into v_target_app_ids
  from public.rsvp_applications as a
  where a.status = 'approved'
    and (
      a.approved_client_id is null
      or not exists (
        select 1 from public.clients as c where c.id = a.approved_client_id
      )
    )
    and (
      p_application_ids is null
      or a.id = any(p_application_ids)
    );

  if array_length(v_target_app_ids, 1) is null or array_length(v_target_app_ids, 1) = 0 then
    return jsonb_build_object(
      'purged_applications_count', 0,
      'purged_payments_count', 0,
      'purged_emails_count', 0,
      'application_ids', '[]'::jsonb
    );
  end if;

  select coalesce(array_agg(p.id order by p.id), '{}'::uuid[])
  into v_target_payment_ids
  from public.payments as p
  where p.application_id = any(v_target_app_ids);

  delete from public.payment_refunds
  where payment_id = any(v_target_payment_ids);

  delete from public.payments
  where id = any(v_target_payment_ids);
  get diagnostics v_purged_payments = row_count;

  delete from public.email_logs
  where application_id = any(v_target_app_ids);
  get diagnostics v_purged_emails = row_count;

  delete from public.meta_capi_deliveries
  where entity_type = 'rsvp_applications'
    and entity_id = any(v_target_app_ids);

  delete from public.rsvp_applications
  where id = any(v_target_app_ids);
  get diagnostics v_purged_apps = row_count;

  return jsonb_build_object(
    'purged_applications_count', v_purged_apps,
    'purged_payments_count', v_purged_payments,
    'purged_emails_count', v_purged_emails,
    'application_ids', to_jsonb(v_target_app_ids)
  );
end;
$$;

revoke all on function public.admin_purge_orphaned_applications(uuid[]) from public;
grant execute on function public.admin_purge_orphaned_applications(uuid[]) to service_role;
