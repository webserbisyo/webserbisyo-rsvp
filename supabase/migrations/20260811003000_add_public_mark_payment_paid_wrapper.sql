-- Phase 6 fix: expose the atomic payment confirmation RPC through public PostgREST.
-- The implementation remains in app_private.mark_payment_paid_atomic.

create or replace function public.mark_payment_paid_atomic(
  p_payment_id uuid,
  p_actor_user_id uuid,
  p_amount_paid numeric default null,
  p_paid_at timestamptz default null,
  p_payment_method text default null,
  p_reference_number text default null,
  p_hosting_starts_at timestamptz default null,
  p_hosting_ends_at timestamptz default null,
  p_renewal_required_at timestamptz default null,
  p_note text default null
)
returns jsonb
language sql
security definer
set search_path = ''
as $function$
  select app_private.mark_payment_paid_atomic(
    p_payment_id => p_payment_id,
    p_actor_user_id => p_actor_user_id,
    p_amount_paid => p_amount_paid,
    p_paid_at => p_paid_at,
    p_payment_method => p_payment_method,
    p_reference_number => p_reference_number,
    p_hosting_starts_at => p_hosting_starts_at,
    p_hosting_ends_at => p_hosting_ends_at,
    p_renewal_required_at => p_renewal_required_at,
    p_note => p_note
  );
$function$;

revoke all on function public.mark_payment_paid_atomic(
  uuid,
  uuid,
  numeric,
  timestamptz,
  text,
  text,
  timestamptz,
  timestamptz,
  timestamptz,
  text
) from public;

grant execute on function public.mark_payment_paid_atomic(
  uuid,
  uuid,
  numeric,
  timestamptz,
  text,
  text,
  timestamptz,
  timestamptz,
  timestamptz,
  text
) to service_role;
