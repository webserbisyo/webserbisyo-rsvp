create table public.rsvp_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  event_type text not null,
  event_date date,
  event_location text,
  preferred_plan text not null,
  estimated_guest_count integer,
  message text,
  status text not null default 'submitted',
  review_notes text,
  approved_client_id uuid references public.clients (id) on delete set null,
  approved_event_id uuid,
  submitted_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint rsvp_applications_preferred_plan_check
    check (preferred_plan in ('pro', 'max')),
  constraint rsvp_applications_status_check
    check (status in ('submitted', 'reviewing', 'approved', 'rejected', 'cancelled')),
  constraint rsvp_applications_event_type_check
    check (event_type in ('wedding', 'debut', 'birthday', 'baptism', 'reunion', 'anniversary', 'corporate', 'other')),
  constraint rsvp_applications_estimated_guest_count_check
    check (estimated_guest_count is null or estimated_guest_count > 0)
);

create trigger set_rsvp_applications_updated_at
before update on public.rsvp_applications
for each row
execute function app_private.set_updated_at();
