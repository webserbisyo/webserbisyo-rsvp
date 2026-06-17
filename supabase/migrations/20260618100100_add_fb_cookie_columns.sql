-- Add Facebook cookie columns for CAPI event matching (EMQ improvement).
-- fb_fbp stores the _fbp cookie value (Browser ID).
-- fb_fbc stores the _fbc cookie value (Click ID / fbclid).
alter table public.rsvp_applications
  add column if not exists fb_fbp text,
  add column if not exists fb_fbc text;
