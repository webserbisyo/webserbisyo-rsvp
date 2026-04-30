alter table public.payments
alter column client_id drop not null,
alter column event_id drop not null;
