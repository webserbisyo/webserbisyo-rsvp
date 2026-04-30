create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  contact_email text not null,
  contact_phone text,
  status text not null default 'active',
  plan_type text not null,
  hosting_starts_at timestamptz,
  hosting_ends_at timestamptz,
  renewal_required_at timestamptz,
  custom_frontend_status text not null default 'not_started',
  custom_frontend_url text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint clients_status_check
    check (status in ('active', 'paused', 'expired', 'archived')),
  constraint clients_plan_type_check
    check (plan_type in ('pro', 'max')),
  constraint clients_custom_frontend_status_check
    check (custom_frontend_status in ('not_started', 'in_progress', 'connected', 'maintenance', 'disabled')),
  constraint clients_hosting_window_check
    check (
      hosting_starts_at is null
      or hosting_ends_at is null
      or hosting_ends_at >= hosting_starts_at
    )
);

create trigger set_clients_updated_at
before update on public.clients
for each row
execute function app_private.set_updated_at();
