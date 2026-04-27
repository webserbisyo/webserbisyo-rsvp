create table public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  application_id uuid not null references public.rsvp_applications (id),
  event_id uuid not null references public.rsvp_events (id),
  plan_type text not null,
  amount_due numeric(12,2) not null,
  amount_paid numeric(12,2) not null default 0,
  currency text not null default 'PHP',
  payment_status text not null default 'pending',
  payment_method text,
  reference_number text,
  paid_at timestamptz,
  confirmed_by uuid references public.profiles (id) on delete set null,
  hosting_starts_at timestamptz,
  hosting_ends_at timestamptz,
  renewal_required_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint payments_plan_type_check
    check (plan_type in ('pro', 'max')),
  constraint payments_payment_status_check
    check (payment_status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  constraint payments_currency_check
    check (currency = 'PHP'),
  constraint payments_amount_due_check
    check (amount_due >= 0),
  constraint payments_amount_paid_check
    check (amount_paid >= 0),
  constraint payments_paid_at_required_check
    check (payment_status <> 'paid' or paid_at is not null),
  constraint payments_paid_amount_required_check
    check (payment_status <> 'paid' or amount_paid > 0),
  constraint payments_hosting_window_check
    check (
      hosting_starts_at is null
      or hosting_ends_at is null
      or hosting_ends_at >= hosting_starts_at
    )
);

create trigger set_payments_updated_at
before update on public.payments
for each row
execute function app_private.set_updated_at();
