create table public.email_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete set null,
  event_id uuid references public.rsvp_events (id) on delete set null,
  application_id uuid references public.rsvp_applications (id) on delete set null,
  recipient_email text not null,
  recipient_name text,
  email_type text not null,
  provider text not null default 'resend',
  provider_message_id text,
  status text not null default 'queued',
  subject text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint email_logs_email_type_check
    check (email_type in ('application_received', 'application_approved', 'client_onboarding', 'payment_confirmed', 'rsvp_confirmation', 'guest_edit_link', 'renewal_reminder')),
  constraint email_logs_provider_check
    check (provider in ('resend')),
  constraint email_logs_status_check
    check (status in ('queued', 'sent', 'failed', 'skipped'))
);

create trigger set_email_logs_updated_at
before update on public.email_logs
for each row
execute function app_private.set_updated_at();
