import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const applicationsSource = readFileSync(
  new URL("../src/server/services/admin-workflow/applications.ts", import.meta.url),
  "utf8",
);
const createClientUserSource = readFileSync(
  new URL("../src/server/services/create-client-user.ts", import.meta.url),
  "utf8",
);
const rpcMigrationSource = readFileSync(
  new URL(
    "../supabase/migrations/20260810193000_fix_provision_event_draft_fields.sql",
    import.meta.url,
  ),
  "utf8",
);

test("Phase 5 RPC provisions Client, Event, Profile, and ONE linked pending Payment atomically", () => {
  assert.match(rpcMigrationSource, /create or replace function app_private\.provision_application_atomic/);
  assert.match(rpcMigrationSource, /insert into public\.rsvp_events/);
  assert.match(rpcMigrationSource, /draft_event_slug/);
  assert.match(rpcMigrationSource, /draft_visibility/);
  assert.match(rpcMigrationSource, /insert into public\.payments/);
  assert.match(rpcMigrationSource, /application_id, client_id, event_id, plan_type, amount_due/);
  assert.match(rpcMigrationSource, /action, entity_type, entity_id, client_id, event_id, metadata/);
  assert.match(rpcMigrationSource, /'client_provisioning_completed'/);
});

test("applications.ts relies on RPC for atomic provisioning and removes duplicate audit log write", () => {
  assert.match(applicationsSource, /\("provision_application_atomic",/);
  // Ensure TS code does not write duplicate client_provisioning_completed audit log
  assert.doesNotMatch(
    applicationsSource,
    /action:\s*"client_provisioning_completed"/,
  );
  assert.match(applicationsSource, /action:\s*"application_approved"/);
});

test("approveApplicationForPayment delegates to canonical approveApplication flow", () => {
  assert.match(
    applicationsSource,
    /export async function approveApplicationForPayment/,
  );
  assert.match(
    applicationsSource,
    /const approvalResult = await approveApplication\(\{ applicationId: input\.applicationId \}, actorUserId\)/,
  );
});

test("create-client-user provides Auth user creation tracking flag for compensation safety", () => {
  assert.match(
    createClientUserSource,
    /export async function ensureAuthUserWithCreationFlag/,
  );
  assert.match(
    createClientUserSource,
    /return \{ userId: existingAuthUser\.id, wasCreated: false \}/,
  );
  assert.match(
    createClientUserSource,
    /return \{ userId: createdUser\.user\.id, wasCreated: true \}/,
  );
});
