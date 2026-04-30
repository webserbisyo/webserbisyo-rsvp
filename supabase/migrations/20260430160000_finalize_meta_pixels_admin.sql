alter table public.meta_pixels
  add column if not exists name text,
  add column if not exists notes text;

update public.meta_pixels
set name = coalesce(nullif(trim(name), ''), 'Meta Pixel ' || right(pixel_id, 4))
where name is null or trim(name) = '';

alter table public.meta_pixels
  alter column name set not null;

update public.meta_pixels
set tracking_scope = case tracking_scope
  when 'platform' then 'global_public'
  when 'client' then 'application'
  else tracking_scope
end;

alter table public.meta_pixels
  drop constraint if exists meta_pixels_tracking_scope_relationship_check,
  drop constraint if exists meta_pixels_tracking_scope_check;

alter table public.meta_pixels
  add constraint meta_pixels_tracking_scope_check
    check (
      tracking_scope in (
        'global_public',
        'application',
        'event_page',
        'rsvp_submit',
        'event',
        'disabled'
      )
    ),
  add constraint meta_pixels_tracking_scope_relationship_check
    check (
      (tracking_scope = 'event' and event_id is not null)
      or (tracking_scope <> 'event' and event_id is null)
    );

alter table public.meta_pixels
  alter column tracking_scope set default 'global_public';

create index if not exists meta_pixels_tracking_scope_idx
  on public.meta_pixels (tracking_scope);

create index if not exists meta_pixels_is_active_idx
  on public.meta_pixels (is_active);

create index if not exists meta_pixels_event_id_idx
  on public.meta_pixels (event_id)
  where event_id is not null;
