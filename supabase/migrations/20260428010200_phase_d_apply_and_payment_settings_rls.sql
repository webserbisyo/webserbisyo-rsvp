revoke all on table public.platform_payment_options from anon, authenticated;
revoke all on table public.platform_public_settings from anon, authenticated;

grant select, insert, update on table public.platform_payment_options to authenticated;
grant select, insert, update on table public.platform_public_settings to authenticated;

alter table public.platform_payment_options enable row level security;
alter table public.platform_public_settings enable row level security;

create policy platform_payment_options_admin_all
on public.platform_payment_options
for all
to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());

create policy platform_public_settings_admin_all
on public.platform_public_settings
for all
to authenticated
using (app_private.is_platform_admin())
with check (app_private.is_platform_admin());
