-- Phase 4: Normalized Application Email Hardening
-- Idempotent partial unique index on lower(btrim(email)) for active applications ('submitted', 'reviewing').

CREATE UNIQUE INDEX IF NOT EXISTS idx_rsvp_applications_unique_active_email
ON public.rsvp_applications (lower(btrim(email)))
WHERE status IN ('submitted', 'reviewing');
