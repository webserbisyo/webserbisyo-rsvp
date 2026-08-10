-- Phase 6: Atomic Mark-as-Paid State RPC
-- Encapsulates database payment status transition and client hosting mirror updates in a single SQL transaction.
-- Fails safely if canonical client_id or event_id linkage is missing.

create or replace function app_private.mark_payment_paid_atomic(
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
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_payment record;
  v_client record;
  v_now timestamptz := now();
  v_paid_at timestamptz;
  v_amount_paid numeric;
  v_merged_notes text;
begin
  -- 1. Lock canonical payment row
  select * into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'Payment not found';
  end if;

  -- 2. Validate canonical linkage
  if v_payment.client_id is null or v_payment.event_id is null then
    raise exception 'Cannot confirm payment: payment is missing linked client or event record. Resolve provisioning first.';
  end if;

  -- 3. Check status transitions
  if v_payment.payment_status not in ('pending', 'paid') then
    raise exception 'This payment cannot be confirmed while it is %', v_payment.payment_status;
  end if;

  v_paid_at := coalesce(v_payment.paid_at, p_paid_at, v_now);
  v_amount_paid := coalesce(p_amount_paid, v_payment.amount_due);

  if p_note is not null and trim(p_note) != '' then
    if v_payment.notes is not null and trim(v_payment.notes) != '' then
      if v_payment.notes = p_note then
        v_merged_notes := v_payment.notes;
      else
        v_merged_notes := v_payment.notes || E'\n\n' || trim(p_note);
      end if;
    else
      v_merged_notes := trim(p_note);
    end if;
  else
    v_merged_notes := v_payment.notes;
  end if;

  -- 4. Update payment row
  update public.payments
  set amount_paid = case when v_payment.payment_status = 'paid' then v_payment.amount_paid else v_amount_paid end,
      confirmed_by = coalesce(confirmed_by, p_actor_user_id),
      hosting_ends_at = coalesce(hosting_ends_at, p_hosting_ends_at),
      hosting_starts_at = coalesce(hosting_starts_at, p_hosting_starts_at),
      notes = v_merged_notes,
      paid_at = v_paid_at,
      payment_method = coalesce(payment_method, p_payment_method, 'manual'),
      payment_status = 'paid',
      reference_number = coalesce(reference_number, p_reference_number),
      renewal_required_at = coalesce(renewal_required_at, p_renewal_required_at),
      updated_at = v_now
  where id = v_payment.id
  returning * into v_payment;

  -- 5. Update linked client hosting/payment state mirrors
  update public.clients
  set hosting_ends_at = coalesce(p_hosting_ends_at, hosting_ends_at),
      hosting_starts_at = coalesce(p_hosting_starts_at, hosting_starts_at),
      renewal_required_at = coalesce(p_renewal_required_at, renewal_required_at),
      status = 'active',
      updated_at = v_now
  where id = v_payment.client_id
  returning * into v_client;

  return jsonb_build_object(
    'payment_id', v_payment.id,
    'client_id', v_payment.client_id,
    'event_id', v_payment.event_id,
    'application_id', v_payment.application_id,
    'payment_status', v_payment.payment_status,
    'amount_paid', v_payment.amount_paid,
    'amount_due', v_payment.amount_due,
    'currency', v_payment.currency,
    'paid_at', v_payment.paid_at,
    'payment_method', v_payment.payment_method,
    'reference_number', v_payment.reference_number
  );
end;
$function$;

revoke all on function app_private.mark_payment_paid_atomic(uuid, uuid, numeric, timestamptz, text, text, timestamptz, timestamptz, timestamptz, text) from public;
grant execute on function app_private.mark_payment_paid_atomic(uuid, uuid, numeric, timestamptz, text, text, timestamptz, timestamptz, timestamptz, text) to service_role;
