create or replace function public.admin_purge_test_clients(
  p_client_ids uuid[],
  p_actor_user_id uuid,
  p_confirmation text,
  p_note text
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_actor_role text;
  v_actor_is_active boolean;
  v_client_id uuid;
  v_client public.clients%rowtype;
  v_client_name text;
  v_event_ids uuid[];
  v_event_count integer;
  v_event_content_count integer;
  v_live_event_count integer;
  v_meta_pixel_count integer;
  v_payment_count integer;
  v_hosting_row_count integer;
  v_response_count integer;
  v_payments_unlinked integer;
  v_meta_pixels_deleted integer;
  v_events_deleted integer;
  v_hosting_rows_disabled integer;
  v_client_rows_deleted integer;
  v_selected_count integer := 0;
  v_purged_count integer := 0;
  v_blocked_count integer := 0;
  v_failed_count integer := 0;
  v_now timestamptz := timezone('utc', now());
  v_note text := btrim(coalesce(p_note, ''));
  v_primary_event record;
  v_application_id uuid;
  v_tombstone_id uuid;
  v_results jsonb := '[]'::jsonb;
begin
  if trim(coalesce(p_confirmation, '')) <> 'DELETE TEST DATA' then
    raise exception 'Type DELETE TEST DATA to confirm.';
  end if;

  if v_note = '' then
    raise exception 'A purge note is required.';
  end if;

  select count(*)
  into v_selected_count
  from (
    select distinct unnest(coalesce(p_client_ids, '{}'::uuid[]))
  ) as selected_clients;

  if v_selected_count = 0 then
    raise exception 'Select at least one client.';
  end if;

  select role, is_active
  into v_actor_role, v_actor_is_active
  from public.profiles
  where id = p_actor_user_id
  limit 1;

  if v_actor_role is distinct from 'platform_admin' or v_actor_is_active is not true then
    raise exception 'Platform admin access is required for purge test data.';
  end if;

  for v_client_id in
    select distinct unnest(coalesce(p_client_ids, '{}'::uuid[]))
  loop
    begin
      v_event_ids := '{}'::uuid[];
      v_event_count := 0;
      v_event_content_count := 0;
      v_live_event_count := 0;
      v_meta_pixel_count := 0;
      v_payment_count := 0;
      v_hosting_row_count := 0;
      v_response_count := 0;
      v_payments_unlinked := 0;
      v_meta_pixels_deleted := 0;
      v_events_deleted := 0;
      v_hosting_rows_disabled := 0;
      v_client_rows_deleted := 0;
      v_application_id := null;
      v_tombstone_id := null;
      v_primary_event := null;

      select *
      into v_client
      from public.clients
      where id = v_client_id
      for update;

      if not found then
        v_failed_count := v_failed_count + 1;
        v_results := v_results || jsonb_build_array(
          jsonb_build_object(
            'client_id', v_client_id,
            'client_name', null,
            'status', 'failed',
            'reason_code', 'client_not_found',
            'message', 'Client record no longer exists.',
            'counts', jsonb_build_object(
              'events', 0,
              'payments_unlinked', 0,
              'responses_blocked', 0,
              'event_content_deleted', 0,
              'meta_pixels_deleted', 0,
              'hosting_rows_disabled_or_unlinked', 0
            )
          )
        );
        continue;
      end if;

      v_client_name := v_client.name;

      select
        coalesce(array_agg(e.id order by e.updated_at desc), '{}'::uuid[]),
        count(*),
        count(*) filter (
          where
            e.status = 'published'
            or e.visibility in ('public', 'unlisted')
            or e.published_at is not null
            or e.custom_frontend_enabled is true
            or e.custom_frontend_url is not null
        )
      into v_event_ids, v_event_count, v_live_event_count
      from public.rsvp_events as e
      where e.client_id = v_client_id;

      select count(*)
      into v_event_content_count
      from public.event_content
      where event_id = any(v_event_ids);

      select count(*)
      into v_response_count
      from public.rsvp_responses
      where client_id = v_client_id;

      select count(distinct p.id)
      into v_payment_count
      from public.payments as p
      where p.client_id = v_client_id
         or p.event_id = any(v_event_ids);

      select count(*)
      into v_meta_pixel_count
      from public.meta_pixels as mp
      where mp.client_id = v_client_id
         or mp.event_id = any(v_event_ids);

      select count(*)
      into v_hosting_row_count
      from public.client_custom_websites as cw
      where cw.client_id = v_client_id
         or cw.event_id = any(v_event_ids);

      if v_live_event_count > 0 then
        v_blocked_count := v_blocked_count + 1;
        v_results := v_results || jsonb_build_array(
          jsonb_build_object(
            'client_id', v_client_id,
            'client_name', v_client_name,
            'status', 'blocked',
            'reason_code', 'live_rsvp',
            'message', 'Client has a live, public, or unlisted RSVP website and remains blocked from purge.',
            'counts', jsonb_build_object(
              'events', v_event_count,
              'payments_unlinked', 0,
              'responses_blocked', v_response_count,
              'event_content_deleted', v_event_content_count,
              'meta_pixels_deleted', 0,
              'hosting_rows_disabled_or_unlinked', 0
            )
          )
        );
        continue;
      end if;

      if v_response_count > 0 then
        v_blocked_count := v_blocked_count + 1;
        v_results := v_results || jsonb_build_array(
          jsonb_build_object(
            'client_id', v_client_id,
            'client_name', v_client_name,
            'status', 'blocked',
            'reason_code', 'has_responses',
            'message', 'Client has persisted RSVP responses and requires guest-data purge approval.',
            'counts', jsonb_build_object(
              'events', v_event_count,
              'payments_unlinked', 0,
              'responses_blocked', v_response_count,
              'event_content_deleted', v_event_content_count,
              'meta_pixels_deleted', 0,
              'hosting_rows_disabled_or_unlinked', 0
            )
          )
        );
        continue;
      end if;

      select
        e.id,
        e.event_date,
        e.event_slug,
        e.event_type
      into v_primary_event
      from public.rsvp_events as e
      where e.client_id = v_client_id
      order by e.event_date desc nulls last, e.updated_at desc
      limit 1;

      select a.id
      into v_application_id
      from public.rsvp_applications as a
      where a.approved_client_id = v_client_id
      order by a.approved_at desc nulls last
      limit 1;

      insert into public.client_deletion_tombstones (
        original_client_id,
        client_name,
        client_email,
        client_status,
        event_id,
        event_slug,
        event_type,
        event_date,
        payment_status,
        payment_summary,
        deleted_reason,
        deleted_by,
        metadata
      )
      values (
        v_client_id,
        v_client.name,
        v_client.contact_email,
        v_client.status,
        v_primary_event.id,
        v_primary_event.event_slug,
        v_primary_event.event_type,
        v_primary_event.event_date,
        (
          select p.payment_status
          from public.payments as p
          where p.client_id = v_client_id
             or p.event_id = any(v_event_ids)
          order by p.updated_at desc
          limit 1
        ),
        jsonb_build_object(
          'count', v_payment_count,
          'ids', coalesce(
            (
              select jsonb_agg(p.id order by p.updated_at desc)
              from public.payments as p
              where p.client_id = v_client_id
                 or p.event_id = any(v_event_ids)
            ),
            '[]'::jsonb
          ),
          'statuses', coalesce(
            (
              select jsonb_agg(p.payment_status order by p.updated_at desc)
              from public.payments as p
              where p.client_id = v_client_id
                 or p.event_id = any(v_event_ids)
            ),
            '[]'::jsonb
          )
        ),
        v_note,
        p_actor_user_id,
        jsonb_build_object(
          'application_id', v_application_id,
          'archived_at', v_client.archived_at,
          'cancelled_at', v_client.cancelled_at,
          'delete_execution_mode', 'purge_test_data',
          'event_content_count', v_event_content_count,
          'event_count', v_event_count,
          'event_response_count', v_response_count,
          'hosting_row_count', v_hosting_row_count,
          'meta_pixel_count', v_meta_pixel_count,
          'payment_count', v_payment_count,
          'purge_note', v_note
        )
      )
      returning id into v_tombstone_id;

      update public.client_custom_websites
      set
        custom_frontend_enabled = false,
        disabled_at = coalesce(disabled_at, v_now),
        status = 'disabled',
        updated_at = v_now
      where client_id = v_client_id
         or event_id = any(v_event_ids);

      get diagnostics v_hosting_rows_disabled = row_count;

      update public.clients
      set
        custom_frontend_status = 'disabled',
        custom_frontend_url = null,
        hosting_ends_at = v_now,
        hosting_starts_at = null,
        renewal_required_at = null,
        updated_at = v_now,
        last_activity_at = v_now
      where id = v_client_id;

      update public.rsvp_events
      set
        custom_frontend_enabled = false,
        custom_frontend_url = null,
        updated_at = v_now
      where id = any(v_event_ids);

      update public.payments
      set
        client_id = null,
        event_id = null,
        notes = case
          when notes is null or btrim(notes) = '' then '[Purge test data] ' || v_note
          else notes || E'\n\n[Purge test data] ' || v_note
        end,
        updated_at = v_now
      where client_id = v_client_id
         or event_id = any(v_event_ids);

      get diagnostics v_payments_unlinked = row_count;

      delete from public.meta_pixels
      where client_id = v_client_id
         or event_id = any(v_event_ids);

      get diagnostics v_meta_pixels_deleted = row_count;

      delete from public.rsvp_events
      where id = any(v_event_ids);

      get diagnostics v_events_deleted = row_count;

      delete from public.clients
      where id = v_client_id;

      get diagnostics v_client_rows_deleted = row_count;

      if v_client_rows_deleted <> 1 then
        raise exception 'Client purge did not remove the client row.';
      end if;

      v_purged_count := v_purged_count + 1;
      v_results := v_results || jsonb_build_array(
        jsonb_build_object(
          'client_id', v_client_id,
          'client_name', v_client_name,
          'status', 'purged',
          'reason_code', 'purged',
          'message', 'Test client data purged. Paid payment evidence was preserved by unlinking protected payment rows before deleting the client and draft/private events.',
          'counts', jsonb_build_object(
            'events', v_events_deleted,
            'payments_unlinked', v_payments_unlinked,
            'responses_blocked', 0,
            'event_content_deleted', v_event_content_count,
            'meta_pixels_deleted', v_meta_pixels_deleted,
            'hosting_rows_disabled_or_unlinked', v_hosting_rows_disabled
          )
        )
      );
    exception
      when others then
        v_failed_count := v_failed_count + 1;
        v_results := v_results || jsonb_build_array(
          jsonb_build_object(
            'client_id', v_client_id,
            'client_name', v_client_name,
            'status', 'failed',
            'reason_code', 'unexpected_error',
            'message', 'Purge failed while unlinking or deleting linked records.',
            'counts', jsonb_build_object(
              'events', v_event_count,
              'payments_unlinked', 0,
              'responses_blocked', v_response_count,
              'event_content_deleted', v_event_content_count,
              'meta_pixels_deleted', 0,
              'hosting_rows_disabled_or_unlinked', 0
            )
          )
        );
    end;
  end loop;

  return jsonb_build_object(
    'selected_count', v_selected_count,
    'purged_count', v_purged_count,
    'blocked_count', v_blocked_count,
    'failed_count', v_failed_count,
    'per_client_results', v_results
  );
end;
$$;

revoke all on function public.admin_purge_test_clients(uuid[], uuid, text, text) from public;
revoke all on function public.admin_purge_test_clients(uuid[], uuid, text, text) from anon;
revoke all on function public.admin_purge_test_clients(uuid[], uuid, text, text) from authenticated;
grant execute on function public.admin_purge_test_clients(uuid[], uuid, text, text) to service_role;
