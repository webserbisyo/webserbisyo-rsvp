grant usage on schema app_private to service_role;
grant execute on function app_private.set_updated_at() to service_role;
grant execute on function app_private.generate_rsvp_application_reference() to service_role;
grant execute on function app_private.set_rsvp_application_reference_code() to service_role;
