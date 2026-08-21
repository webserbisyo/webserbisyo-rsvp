-- Add client_ip_address and client_user_agent to rsvp_applications for full Meta CAPI matching
alter table public.rsvp_applications
  add column if not exists client_ip_address text,
  add column if not exists client_user_agent text;

comment on column public.rsvp_applications.client_ip_address is
  'Client IP address captured at application submission for Meta Conversions API attribution matching.';

comment on column public.rsvp_applications.client_user_agent is
  'Client User Agent captured at application submission for Meta Conversions API attribution matching.';
