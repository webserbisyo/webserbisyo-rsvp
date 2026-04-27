alter table public.rsvp_applications
add constraint rsvp_applications_approved_event_id_fkey
foreign key (approved_event_id)
references public.rsvp_events (id)
on delete set null;
