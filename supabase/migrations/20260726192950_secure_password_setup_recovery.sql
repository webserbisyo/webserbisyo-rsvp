-- Phase 2 secure password setup and recovery email support.
--
-- Preconditions:
--   * public.email_logs and its email_logs_email_type_check constraint exist.
--   * Existing email types remain valid; this migration only adds two values.
--
-- Forward behavior:
--   * First-time setup and forgotten-password delivery attempts are logged as
--     distinct email types.
--   * Profile emails are unique under lower-case normalization, matching
--     Supabase Auth's one-account-per-email model.
--   * A partial unique index prevents concurrent duplicate queued deliveries
--     for the same client and password-email intent.
--
-- Verification queries:
--   select pg_get_constraintdef(oid)
--   from pg_constraint
--   where conname = 'email_logs_email_type_check';
--   select indexdef from pg_indexes
--   where indexname = 'uq_email_logs_password_delivery_in_flight';
--
-- Rollback considerations:
--   Keep both new email types while any corresponding logs exist. Dropping the
--   unique index is mechanically safe, but doing so would remove concurrent
--   send protection and is not recommended.

do $preconditions$
begin
  if to_regclass('public.email_logs') is null then
    raise exception 'Missing public.email_logs table';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.email_logs'::regclass
      and conname = 'email_logs_email_type_check'
  ) then
    raise exception 'Missing email_logs_email_type_check constraint';
  end if;

  if exists (
    select 1
    from public.profiles
    group by lower(email)
    having count(*) > 1
  ) then
    raise exception 'Duplicate normalized profile emails require manual repair';
  end if;
end
$preconditions$;

alter table public.email_logs
drop constraint email_logs_email_type_check;

alter table public.email_logs
add constraint email_logs_email_type_check
check (
  email_type in (
    'application_received',
    'application_approved',
    'client_onboarding',
    'client_password_setup',
    'client_password_recovery',
    'payment_confirmed',
    'rsvp_confirmation',
    'guest_edit_link',
    'renewal_reminder'
  )
) not valid;

alter table public.email_logs
validate constraint email_logs_email_type_check;

create unique index uq_email_logs_password_delivery_in_flight
on public.email_logs (client_id)
where
  status = 'queued'
  and client_id is not null
  and email_type in ('client_password_setup', 'client_password_recovery');

create index idx_email_logs_password_delivery_rate_limit
on public.email_logs (client_id, email_type, created_at desc)
where email_type in ('client_password_setup', 'client_password_recovery');

create unique index uq_profiles_email_lower
on public.profiles (lower(email));
