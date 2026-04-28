create or replace function app_private.generate_rsvp_application_reference()
returns text
language plpgsql
set search_path = ''
as $$
declare
  candidate text;
  reference_date text := to_char(timezone('utc', now()), 'YYYYMMDD');
begin
  loop
    candidate := format(
      'RSVP-%s-%s',
      reference_date,
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4))
    );

    exit when not exists (
      select 1
      from public.rsvp_applications
      where reference_code = candidate
    );
  end loop;

  return candidate;
end;
$$;

create or replace function app_private.set_rsvp_application_reference_code()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.reference_code is null or btrim(new.reference_code) = '' then
    new.reference_code := app_private.generate_rsvp_application_reference();
  end if;

  return new;
end;
$$;

alter table public.rsvp_applications
add column if not exists reference_code text;

alter table public.rsvp_applications
add column if not exists preferred_manual_payment_option text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rsvp_applications_reference_code_check'
  ) then
    alter table public.rsvp_applications
    add constraint rsvp_applications_reference_code_check
      check (reference_code ~ '^RSVP-[0-9]{8}-[A-Z0-9]{4}$');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'rsvp_applications_preferred_manual_payment_option_check'
  ) then
    alter table public.rsvp_applications
    add constraint rsvp_applications_preferred_manual_payment_option_check
      check (
        preferred_manual_payment_option is null
        or preferred_manual_payment_option in ('gcash', 'maya')
      );
  end if;
end $$;

update public.rsvp_applications
set reference_code = app_private.generate_rsvp_application_reference()
where reference_code is null
   or btrim(reference_code) = '';

alter table public.rsvp_applications
alter column reference_code set not null;

create unique index if not exists rsvp_applications_reference_code_key
on public.rsvp_applications (reference_code);

drop trigger if exists set_rsvp_applications_reference_code on public.rsvp_applications;

create trigger set_rsvp_applications_reference_code
before insert on public.rsvp_applications
for each row
execute function app_private.set_rsvp_application_reference_code();

create table if not exists public.platform_payment_options (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  is_enabled boolean not null default false,
  account_name text,
  account_number text,
  qr_image_path text,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint platform_payment_options_provider_check
    check (provider in ('gcash', 'maya'))
);

create unique index if not exists platform_payment_options_provider_key
on public.platform_payment_options (provider);

create table if not exists public.platform_public_settings (
  id uuid primary key default gen_random_uuid(),
  messenger_page_url text,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists platform_public_settings_singleton_key
on public.platform_public_settings ((true));

create trigger set_platform_payment_options_updated_at
before update on public.platform_payment_options
for each row
execute function app_private.set_updated_at();

create trigger set_platform_public_settings_updated_at
before update on public.platform_public_settings
for each row
execute function app_private.set_updated_at();

insert into public.platform_payment_options (provider, is_enabled)
values
  ('gcash', false),
  ('maya', false)
on conflict (provider) do nothing;

insert into storage.buckets (id, name, public)
values ('payment-qr-images', 'payment-qr-images', true)
on conflict (id) do update
set public = excluded.public;
