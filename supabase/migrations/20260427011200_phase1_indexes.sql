create index if not exists idx_clients_status
on public.clients (status);

create index if not exists idx_clients_plan_type
on public.clients (plan_type);

create index if not exists idx_clients_contact_email_lower
on public.clients (lower(contact_email));

create index if not exists idx_profiles_client_id
on public.profiles (client_id);

create index if not exists idx_profiles_role
on public.profiles (role);

create index if not exists idx_profiles_email_lower
on public.profiles (lower(email));

create index if not exists idx_rsvp_applications_status
on public.rsvp_applications (status);

create index if not exists idx_rsvp_applications_email_lower
on public.rsvp_applications (lower(email));

create index if not exists idx_rsvp_applications_submitted_at_desc
on public.rsvp_applications (submitted_at desc);

create unique index if not exists idx_rsvp_events_event_slug
on public.rsvp_events (event_slug);

create index if not exists idx_rsvp_events_client_id
on public.rsvp_events (client_id);

create index if not exists idx_rsvp_events_status
on public.rsvp_events (status);

create unique index if not exists idx_rsvp_events_one_active_per_client
on public.rsvp_events (client_id)
where status <> 'archived';

create index if not exists idx_payments_client_id
on public.payments (client_id);

create index if not exists idx_payments_payment_status
on public.payments (payment_status);

create index if not exists idx_payments_paid_at
on public.payments (paid_at);

create unique index if not exists idx_payments_application_id
on public.payments (application_id);

create index if not exists idx_email_logs_client_id
on public.email_logs (client_id);

create index if not exists idx_email_logs_status
on public.email_logs (status);

create index if not exists idx_email_logs_created_at_desc
on public.email_logs (created_at desc);

create index if not exists idx_audit_logs_client_id
on public.audit_logs (client_id);

create index if not exists idx_audit_logs_actor_user_id
on public.audit_logs (actor_user_id);

create index if not exists idx_audit_logs_created_at_desc
on public.audit_logs (created_at desc);

create index if not exists idx_audit_logs_entity
on public.audit_logs (entity_type, entity_id);
