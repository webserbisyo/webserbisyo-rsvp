import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const { parseApplicationDraft, serializeApplicationDraft } =
  await import("../src/lib/apply/application-draft.ts");
const {
  ACTIVE_APPLICATION_STATUS_VALUES,
  APPLICATION_STATUS_VALUES,
  CLIENT_STATUS_VALUES,
  FUNNEL_CURRENCY_VALUES,
  FUNNEL_PLAN_VALUES,
  PAYMENT_STATUS_VALUES,
} = await import("../src/lib/domain/funnel.ts");

const actionSource = readFileSync(
  new URL("../src/server/actions/applications.ts", import.meta.url),
  "utf8",
);
const formSource = readFileSync(
  new URL("../src/components/apply/apply-form.tsx", import.meta.url),
  "utf8",
);

test("application action preserves structured success, validation, and duplicate responses", () => {
  assert.match(actionSource, /return actionSuccess/);
  assert.match(actionSource, /return actionFailure\(error\)/);
  assert.match(formSource, /if \(!result\.ok\)/);
  assert.match(formSource, /assignServerFieldErrors\(result\.fieldErrors\)/);
  assert.match(formSource, /This email is already linked to an application or account/);
});

test("application draft round-trips safe form values and rejects malformed storage", () => {
  const draft = {
    email: "qa@example.com",
    eventDate: "2026-12-20",
    fullName: "QA Couple",
    preferredPlan: "pro",
    step: 2,
  };

  assert.deepEqual(parseApplicationDraft(serializeApplicationDraft(draft)), draft);
  assert.equal(parseApplicationDraft("not-json"), null);
  assert.equal(parseApplicationDraft(JSON.stringify({ email: "x".repeat(321) })), null);
});

test("rejected submission transport preserves the draft without automatic resubmission", () => {
  assert.match(formSource, /try \{\s*result = await submitApplicationAction/);
  assert.match(formSource, /catch \{[\s\S]*APPLY_DRAFT_STORAGE_KEY/);
  assert.match(formSource, /setSubmissionTransportFailed\(true\)/);
  assert.match(formSource, /window\.location\.reload\(\)/);
  assert.doesNotMatch(
    formSource,
    /catch \{[\s\S]*submitApplicationAction\(enrichedValues\)[\s\S]*submitApplicationAction\(enrichedValues\)/,
  );
});

test("funnel domain contracts match the database-constrained values", () => {
  assert.deepEqual(FUNNEL_PLAN_VALUES, ["pro", "max"]);
  assert.deepEqual(APPLICATION_STATUS_VALUES, [
    "submitted",
    "reviewing",
    "approved",
    "rejected",
    "cancelled",
  ]);
  assert.deepEqual(ACTIVE_APPLICATION_STATUS_VALUES, ["submitted", "reviewing"]);
  assert.deepEqual(PAYMENT_STATUS_VALUES, ["pending", "paid", "failed", "refunded", "cancelled"]);
  assert.deepEqual(CLIENT_STATUS_VALUES, ["active", "paused", "expired", "archived", "cancelled"]);
  assert.deepEqual(FUNNEL_CURRENCY_VALUES, ["PHP"]);
});
