create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  event_id uuid references public.rsvp_events (id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint audit_logs_metadata_object_check
    check (jsonb_typeof(metadata) = 'object')
);

create trigger prevent_audit_logs_mutation
before update or delete on public.audit_logs
for each row
execute function app_private.prevent_audit_log_mutation();
