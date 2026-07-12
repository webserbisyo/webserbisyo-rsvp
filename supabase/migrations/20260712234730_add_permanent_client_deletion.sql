set lock_timeout = '5s';
set statement_timeout = '30s';

alter table public.profiles
drop constraint if exists profiles_id_fkey;

alter table public.profiles
add constraint profiles_id_fkey
foreign key (id)
references auth.users (id)
on delete cascade;

drop function if exists public.admin_purge_test_clients(uuid[], uuid, text, text);

create or replace function app_private.prevent_audit_log_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  canonical_owner name;
begin
  if tg_op = 'DELETE' then
    select pg_get_userbyid(p.proowner)
    into canonical_owner
    from pg_proc as p
    where p.oid = to_regprocedure(
      'public.admin_purge_client_permanently(uuid,uuid[])'
    );

    -- Only the canonical SECURITY DEFINER function may enable this transaction-local bypass.
    if current_setting('app.permanent_client_purge', true) = 'on'
      and canonical_owner is not null
      and current_user = canonical_owner then
      return old;
    end if;

    raise exception 'audit_logs is append-only';
  end if;

  if tg_op = 'UPDATE'
    and new.entity_type is not distinct from old.entity_type
    and new.entity_id is not distinct from old.entity_id
    and new.action is not distinct from old.action
    and new.metadata is not distinct from old.metadata
    and new.ip_address is not distinct from old.ip_address
    and new.user_agent is not distinct from old.user_agent
    and new.created_at is not distinct from old.created_at
    and (
      new.actor_user_id is not distinct from old.actor_user_id
      or (old.actor_user_id is not null and new.actor_user_id is null)
    )
    and (
      new.client_id is not distinct from old.client_id
      or (old.client_id is not null and new.client_id is null)
    )
    and (
      new.event_id is not distinct from old.event_id
      or (old.event_id is not null and new.event_id is null)
    ) then
    return new;
  end if;

  raise exception 'audit_logs is append-only';
end;
$$;

revoke all on function app_private.prevent_audit_log_mutation() from public;

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
begin
  perform 1
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
     or a.approved_event_id = any(v_event_ids);

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
      'clients', v_client_rows,
      'email_logs', v_email_logs,
      'event_content', v_event_content,
      'meta_pixels', v_meta_pixels,
      'notification_preferences', v_notification_preferences,
      'payment_refunds', v_payment_refunds,
      'payments', v_payments,
      'push_subscriptions', v_push_subscriptions,
      'rsvp_events', v_events,
      'rsvp_responses', v_responses,
      'tombstones', v_tombstones
    )
  );
end;
$$;

revoke all on function public.admin_purge_client_permanently(uuid, uuid[]) from public;
revoke all on function public.admin_purge_client_permanently(uuid, uuid[]) from anon;
revoke all on function public.admin_purge_client_permanently(uuid, uuid[]) from authenticated;
grant execute on function public.admin_purge_client_permanently(uuid, uuid[]) to service_role;
