create or replace function public.claim_meta_capi_delivery(
  p_provider text,
  p_event_name text,
  p_event_id text,
  p_entity_type text,
  p_entity_id uuid,
  p_stale_after_seconds integer default 300
)
returns table (
  delivery_id uuid,
  delivery_status text,
  claim_token uuid,
  attempt_count integer,
  claim_acquired boolean
)
language sql
security definer
set search_path = ''
as $$
  select *
  from app_private.claim_meta_capi_delivery(
    p_provider,
    p_event_name,
    p_event_id,
    p_entity_type,
    p_entity_id,
    p_stale_after_seconds
  );
$$;

revoke all on function public.claim_meta_capi_delivery(text, text, text, text, uuid, integer) from public;
grant execute on function public.claim_meta_capi_delivery(text, text, text, text, uuid, integer) to service_role;
