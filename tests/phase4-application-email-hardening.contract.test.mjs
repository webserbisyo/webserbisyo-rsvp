import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const submitAppSource = readFileSync(
  new URL("../src/server/services/submit-application.ts", import.meta.url),
  "utf8",
);
const migrationSource = readFileSync(
  new URL(
    "../supabase/migrations/20260810170000_phase4_normalized_application_email_idx.sql",
    import.meta.url,
  ),
  "utf8",
);

test("Phase 4 migration creates partial unique index on lower(btrim(email)) for active applications", () => {
  assert.match(migrationSource, /CREATE UNIQUE INDEX IF NOT EXISTS idx_rsvp_applications_unique_active_email/);
  assert.match(migrationSource, /ON public\.rsvp_applications \(lower\(btrim\(email\)\)\)/);
  assert.match(migrationSource, /WHERE status IN \('submitted', 'reviewing'\)/);
});

test("submitApplication normalizes email with trim and lowercase before insert and lookup", () => {
  assert.match(submitAppSource, /const normalizedEmail = payload\.email\.trim\(\)\.toLowerCase\(\)/);
  assert.match(submitAppSource, /email: normalizedEmail/);
  assert.match(submitAppSource, /\.ilike\("contact_email", normalizedEmail\)/);
  assert.match(submitAppSource, /\.eq\("email", normalizedEmail\)/);
  assert.match(submitAppSource, /\.in\("status", \["submitted", "reviewing"\]\)/);
});

test("submitApplication handles active email unique constraint 23505 conflict as friendly duplicate error", () => {
  assert.match(submitAppSource, /function isActiveEmailConflict\(error: unknown\)/);
  assert.match(submitAppSource, /candidate\.code === "23505"/);
  assert.match(submitAppSource, /idx_rsvp_applications_unique_active_email/);
  assert.match(submitAppSource, /throw DUPLICATE_EMAIL_ZOD_ERROR/);
  assert.match(
    submitAppSource,
    /This email is already linked to an application or account/,
  );
});

test("submitApplication preserves reference code collision retry logic independently", () => {
  assert.match(submitAppSource, /function isReferenceCodeConflict\(error: unknown\)/);
  assert.match(submitAppSource, /rsvp_applications_reference_code_key/);
  assert.match(submitAppSource, /for \(let attempt = 0; attempt < 3; attempt \+= 1\)/);
  assert.match(submitAppSource, /if \(!isReferenceCodeConflict\(result\.error\)\)/);
});
