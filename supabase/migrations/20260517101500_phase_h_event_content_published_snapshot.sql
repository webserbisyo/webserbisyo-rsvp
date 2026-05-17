alter table public.event_content
add column if not exists published_content_json jsonb;

alter table public.event_content
add column if not exists published_at timestamptz;

alter table public.event_content
add column if not exists published_by uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'event_content_published_by_fkey'
      and conrelid = 'public.event_content'::regclass
  ) then
    alter table public.event_content
    add constraint event_content_published_by_fkey
    foreign key (published_by)
    references public.profiles (id)
    on delete set null;
  end if;
end
$$;

comment on column public.event_content.published_content_json is
  'Published Event Website snapshot used by public rendering. Draft editing continues to use content_json.';

comment on column public.event_content.published_at is
  'Timestamp when the published Event Website snapshot was last updated.';

comment on column public.event_content.published_by is
  'Profile that last published the Event Website snapshot.';

grant select, insert, update on table public.event_content to service_role;
