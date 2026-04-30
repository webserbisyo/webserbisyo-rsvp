alter table public.clients
  add column if not exists last_activity_at timestamptz not null default timezone('utc', now());

update public.clients
set last_activity_at = coalesce(last_activity_at, updated_at, created_at, timezone('utc', now()))
where last_activity_at is null;

create or replace function app_private.set_client_activity_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  new.last_activity_at = timezone('utc', now());
  return new;
end;
$$;

revoke all on function app_private.set_client_activity_at() from public;
grant execute on function app_private.set_client_activity_at() to authenticated;
grant execute on function app_private.set_client_activity_at() to service_role;

drop trigger if exists set_clients_activity_at on public.clients;

create trigger set_clients_activity_at
before update on public.clients
for each row
execute function app_private.set_client_activity_at();

create table if not exists public.payment_refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  method text,
  reference_number text,
  confirmed_at timestamptz not null,
  reason_note text,
  created_by uuid references public.profiles (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_payment_refunds_payment_id
on public.payment_refunds (payment_id);

create index if not exists idx_payment_refunds_client_id
on public.payment_refunds (client_id);

create index if not exists idx_payment_refunds_confirmed_at_desc
on public.payment_refunds (confirmed_at desc);

revoke all on table public.payment_refunds from anon, authenticated;
grant select, insert on table public.payment_refunds to authenticated;
grant select, insert on table public.payment_refunds to service_role;

alter table public.payment_refunds enable row level security;

drop policy if exists payment_refunds_admin_all on public.payment_refunds;

create policy payment_refunds_admin_all
on public.payment_refunds
for all
to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create table if not exists public.client_deletion_tombstones (
  id uuid primary key default gen_random_uuid(),
  original_client_id uuid,
  client_name text not null,
  client_email text not null,
  client_status text,
  event_id uuid,
  event_slug text,
  event_type text,
  event_date date,
  payment_status text,
  payment_summary jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payment_summary) = 'object'),
  deleted_reason text,
  deleted_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object')
);

create index if not exists idx_client_deletion_tombstones_original_client_id
on public.client_deletion_tombstones (original_client_id);

create index if not exists idx_client_deletion_tombstones_deleted_at_desc
on public.client_deletion_tombstones (deleted_at desc);

revoke all on table public.client_deletion_tombstones from anon, authenticated;
grant select, insert on table public.client_deletion_tombstones to authenticated;
grant select, insert on table public.client_deletion_tombstones to service_role;

alter table public.client_deletion_tombstones enable row level security;

drop policy if exists client_deletion_tombstones_admin_all on public.client_deletion_tombstones;

create policy client_deletion_tombstones_admin_all
on public.client_deletion_tombstones
for all
to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

grant select, insert, update on table public.email_logs to service_role;
grant delete on table public.meta_pixels to service_role;
grant delete on table public.payments to service_role;
grant delete on table public.rsvp_events to service_role;
grant delete on table public.clients to service_role;
