alter table public.rsvp_applications
  add column first_name text null,
  add column last_name text null;

-- Add check constraints to ensure if provided, they meet minimum lengths
alter table public.rsvp_applications
  add constraint rsvp_applications_first_name_check
    check (first_name is null or length(btrim(first_name)) > 0),
  add constraint rsvp_applications_last_name_check
    check (last_name is null or length(btrim(last_name)) > 0);
