import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const predicates = await import(
  new URL("../src/components/dashboard/responses/rsvp-responses-types.ts", import.meta.url)
);

function response(overrides = {}) {
  return {
    archivedAt: null,
    clientId: "client",
    companions: [],
    dietaryNotes: null,
    email: null,
    eventId: "event",
    guestName: "Guest",
    hostConfirmationStatus: "pending",
    hostConfirmedAt: null,
    hostConfirmedBy: null,
    id: "response",
    message: null,
    messageApprovedAt: null,
    messageApprovedBy: null,
    messagePublicConsent: false,
    messagePublicStatus: "private",
    partySize: 1,
    phone: null,
    reviewStatus: "approved",
    source: null,
    status: "attending",
    submittedAt: "2026-08-09T00:00:00.000Z",
    updatedAt: "2026-08-09T00:00:00.000Z",
    ...overrides,
  };
}

test("confirmed guests are active attending responses independent of messages", () => {
  const noMessage = response({ hostConfirmationStatus: "confirmed" });
  const privateMessage = response({ hostConfirmationStatus: "confirmed", message: "Private note" });

  assert.equal(predicates.isConfirmedGuest(noMessage), true);
  assert.equal(predicates.isConfirmedGuest(privateMessage), true);
  assert.equal(predicates.isGuestbookPublished(noMessage), false);
  assert.equal(predicates.isGuestbookPublished(privateMessage), false);
  assert.equal(predicates.matchesResponseTab(noMessage, "confirmed"), true);
});

test("invalid final-list combinations never satisfy the confirmed predicate", () => {
  assert.equal(
    predicates.isConfirmedGuest(
      response({ hostConfirmationStatus: "confirmed", status: "not_attending" }),
    ),
    false,
  );
  assert.equal(
    predicates.isConfirmedGuest(
      response({ hostConfirmationStatus: "confirmed", reviewStatus: "rejected" }),
    ),
    false,
  );
  assert.equal(
    predicates.isConfirmedGuest(
      response({ hostConfirmationStatus: "confirmed", archivedAt: "2026-08-09" }),
    ),
    false,
  );
});

test("Guestbook publication remains independent from host confirmation", () => {
  const publishedPending = response({
    message: "Congratulations",
    messagePublicStatus: "approved",
  });
  assert.equal(predicates.isGuestbookPublished(publishedPending), true);
  assert.equal(predicates.isConfirmedGuest(publishedPending), false);
  assert.equal(predicates.matchesResponseTab(publishedPending, "guestbook"), true);
});

test("migration preserves explicit confirmation constraints and transport idempotency", () => {
  const migration = readFileSync(
    new URL(
      "../supabase/migrations/20260809082853_rsvp_confirmed_guest_and_submission_idempotency.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(migration, /host_confirmation_status text not null default 'pending'/);
  assert.match(migration, /attendance_status = 'attending'/);
  assert.match(migration, /review_status = 'approved'/);
  assert.match(migration, /archived_at is null/);
  assert.match(migration, /\(event_id, submission_id\)/);
  assert.match(migration, /where submission_id is not null/);
  assert.match(migration, /submit_rsvp_response_with_capacity_check_v2/);
  assert.doesNotMatch(migration, /unique\s*\(\s*event_id\s*,\s*email/i);
  assert.doesNotMatch(migration, /unique\s*\(\s*event_id\s*,\s*phone/i);
});

test("all PDF status renderers use review status", () => {
  const exportSource = readFileSync(
    new URL("../src/components/dashboard/responses/rsvp-responses-export.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(exportSource, /getResponseStatusLabel\(row\.status\)(?!,)/);
});
