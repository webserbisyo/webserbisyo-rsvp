create table public.meta_capi_deliveries (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_name text not null,
  event_id text not null,
  entity_type text not null,
  entity_id uuid not null,
  status text not null default 'pending',
  attempts integer not null default 0,
  claim_token uuid,
  claimed_at timestamptz,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint meta_capi_deliveries_provider_check check (provider in ('meta')),
  constraint meta_capi_deliveries_status_check check (status in ('pending', 'sending', 'sent', 'failed')),
  constraint meta_capi_deliveries_attempts_check check (attempts >= 0),
  constraint meta_capi_deliveries_delivery_identity_key unique (provider, event_name, event_id)
);

create index meta_capi_deliveries_entity_idx
  on public.meta_capi_deliveries (entity_type, entity_id);

create index meta_capi_deliveries_recovery_idx
  on public.meta_capi_deliveries (status, claimed_at)
  where status in ('failed', 'sending');

create trigger set_meta_capi_deliveries_updated_at
before update on public.meta_capi_deliveries
for each row
execute function app_private.set_updated_at();

alter table public.meta_capi_deliveries enable row level security;

revoke all on table public.meta_capi_deliveries from anon, authenticated;
grant select on table public.meta_capi_deliveries to authenticated;
grant select, insert, update on table public.meta_capi_deliveries to service_role;

create policy meta_capi_deliveries_admin_select
on public.meta_capi_deliveries
for select
to authenticated
using (app_private.is_platform_admin());

create or replace function app_private.claim_meta_capi_delivery(
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
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claim_token uuid := gen_random_uuid();
begin
  if p_stale_after_seconds < 1 or p_stale_after_seconds > 3600 then
    raise exception 'p_stale_after_seconds must be between 1 and 3600';
  end if;

  return query
  with claimed as (
    insert into public.meta_capi_deliveries (
      provider,
      event_name,
      event_id,
      entity_type,
      entity_id,
      status,
      attempts,
      claim_token,
      claimed_at,
      last_attempt_at,
      last_error_code
    )
    values (
      p_provider,
      p_event_name,
      p_event_id,
      p_entity_type,
      p_entity_id,
      'sending',
      1,
      v_claim_token,
      timezone('utc', now()),
      timezone('utc', now()),
      null
    )
    on conflict (provider, event_name, event_id) do update
    set
      status = 'sending',
      attempts = public.meta_capi_deliveries.attempts + 1,
      claim_token = v_claim_token,
      claimed_at = timezone('utc', now()),
      last_attempt_at = timezone('utc', now()),
      last_error_code = null
    where
      public.meta_capi_deliveries.status = 'failed'
      or (
        public.meta_capi_deliveries.status = 'sending'
        and public.meta_capi_deliveries.claimed_at <
          timezone('utc', now()) - make_interval(secs => p_stale_after_seconds)
      )
    returning
      public.meta_capi_deliveries.id,
      public.meta_capi_deliveries.status,
      public.meta_capi_deliveries.claim_token,
      public.meta_capi_deliveries.attempts,
      true
  )
  select * from claimed
  union all
  select
    existing.id,
    existing.status,
    null::uuid,
    existing.attempts,
    false
  from public.meta_capi_deliveries as existing
  where
    existing.provider = p_provider
    and existing.event_name = p_event_name
    and existing.event_id = p_event_id
    and not exists (select 1 from claimed)
  limit 1;
end;
$$;

revoke all on function app_private.claim_meta_capi_delivery(text, text, text, text, uuid, integer) from public;
grant usage on schema app_private to service_role;
grant execute on function app_private.claim_meta_capi_delivery(text, text, text, text, uuid, integer) to service_role;
