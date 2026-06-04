alter table public.client_custom_websites
add column if not exists preview_enabled boolean not null default true,
add column if not exists last_health_status text not null default 'unknown',
add column if not exists last_health_checked_at timestamptz null,
add column if not exists last_health_error text null,
add column if not exists last_origin_response_ms integer null,
add column if not exists last_origin_status_code integer null,
add column if not exists last_previewed_at timestamptz null;

alter table public.client_custom_websites
drop constraint if exists client_custom_websites_last_health_status_check;

alter table public.client_custom_websites
add constraint client_custom_websites_last_health_status_check
check (last_health_status in ('unknown', 'healthy', 'unhealthy'));
