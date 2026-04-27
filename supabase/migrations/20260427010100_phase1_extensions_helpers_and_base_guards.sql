create extension if not exists pgcrypto with schema public;

create schema if not exists app_private;

revoke all on schema app_private from public;

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

revoke all on function app_private.set_updated_at() from public;

create or replace function app_private.prevent_event_slug_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.event_slug is distinct from old.event_slug then
    raise exception 'event_slug is immutable once created';
  end if;

  return new;
end;
$$;

revoke all on function app_private.prevent_event_slug_update() from public;

create or replace function app_private.prevent_audit_log_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_logs is append-only';
end;
$$;

revoke all on function app_private.prevent_audit_log_mutation() from public;
