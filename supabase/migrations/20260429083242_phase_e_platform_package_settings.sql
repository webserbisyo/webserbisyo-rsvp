create table if not exists public.platform_package_settings (
  id uuid primary key default gen_random_uuid(),
  plan_type text not null,
  default_amount numeric(12,2),
  currency text not null default 'PHP',
  default_hosting_days integer,
  renewal_notice_days integer,
  is_active boolean not null default true,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint platform_package_settings_plan_type_check
    check (plan_type in ('pro', 'max')),
  constraint platform_package_settings_currency_check
    check (currency = 'PHP'),
  constraint platform_package_settings_default_amount_check
    check (default_amount is null or default_amount >= 0),
  constraint platform_package_settings_default_hosting_days_check
    check (default_hosting_days is null or default_hosting_days > 0),
  constraint platform_package_settings_renewal_notice_days_check
    check (renewal_notice_days is null or renewal_notice_days >= 0)
);

create unique index if not exists platform_package_settings_plan_type_key
on public.platform_package_settings (plan_type);

drop trigger if exists set_platform_package_settings_updated_at on public.platform_package_settings;

create trigger set_platform_package_settings_updated_at
before update on public.platform_package_settings
for each row
execute function app_private.set_updated_at();

revoke all on table public.platform_package_settings from anon, authenticated;

grant select, insert, update on table public.platform_package_settings to authenticated;
grant select, insert, update on table public.platform_package_settings to service_role;

alter table public.platform_package_settings enable row level security;

drop policy if exists platform_package_settings_admin_all on public.platform_package_settings;

create policy platform_package_settings_admin_all
on public.platform_package_settings
for all
to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

insert into public.platform_package_settings (
  plan_type,
  default_amount,
  default_hosting_days,
  renewal_notice_days,
  is_active
)
values
  ('pro', null, null, null, true),
  ('max', null, null, null, true)
on conflict (plan_type) do nothing;
