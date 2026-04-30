alter table public.clients
  add column if not exists cancelled_at timestamptz null,
  add column if not exists archived_at timestamptz null;

alter table public.clients
  drop constraint if exists clients_status_check;

alter table public.clients
  add constraint clients_status_check
  check (status = any (array[
    'active'::text,
    'paused'::text,
    'expired'::text,
    'archived'::text,
    'cancelled'::text
  ]));
