-- Grant INSERT and UPDATE on meta_pixels to service_role.
-- Fixes "Failed to save Meta Pixel configuration" bug where saveMetaPixel()
-- uses createAdminClient() (service_role) but only SELECT and DELETE were granted.
grant insert, update on table public.meta_pixels to service_role;
