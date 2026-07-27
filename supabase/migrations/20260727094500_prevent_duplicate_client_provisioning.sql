-- Preconditions:
-- 1. No two clients may share the same lowercased, trimmed contact email.
-- 2. Empty contact emails are invalid provisioning identifiers.
--
-- Forward behavior:
-- Serializes concurrent client provisioning at the database uniqueness boundary.
-- The application service remains responsible for reconciling and retrying a
-- pre-existing client rather than overwriting ownership.
--
-- Verification after apply:
-- select count(*) = 0 as duplicate_client_emails
-- from (
--   select lower(btrim(contact_email))
--   from public.clients
--   group by lower(btrim(contact_email))
--   having count(*) > 1
-- ) duplicates;
--
-- select indexdef
-- from pg_indexes
-- where schemaname = 'public'
--   and indexname = 'uq_clients_contact_email_normalized';
--
-- Rollback consideration:
-- drop index if exists public.uq_clients_contact_email_normalized;
-- Do not roll back while concurrent provisioning is enabled unless another
-- serialization mechanism has replaced this constraint.

do $$
begin
  if exists (
    select 1
    from public.clients
    where nullif(btrim(contact_email), '') is null
  ) then
    raise exception
      'Migration precondition failed: clients contains a blank contact_email';
  end if;

  if exists (
    select 1
    from public.clients
    group by lower(btrim(contact_email))
    having count(*) > 1
  ) then
    raise exception
      'Migration precondition failed: duplicate normalized client contact emails require manual repair';
  end if;
end
$$;

create unique index if not exists uq_clients_contact_email_normalized
  on public.clients (lower(btrim(contact_email)));
