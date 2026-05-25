alter table public.rsvp_responses
add column if not exists message_public_status text not null default 'private',
add column if not exists message_public_consent boolean not null default false,
add column if not exists message_approved_at timestamptz,
add column if not exists message_approved_by uuid references public.profiles (id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rsvp_responses_message_public_status_check'
  ) then
    alter table public.rsvp_responses
    add constraint rsvp_responses_message_public_status_check
      check (message_public_status in ('private', 'pending_review', 'approved', 'hidden'));
  end if;
end
$$;

create index if not exists idx_rsvp_responses_approved_guestbook_lookup
on public.rsvp_responses (event_id, submitted_at desc)
where message_public_status = 'approved'
  and message is not null
  and archived_at is null;
