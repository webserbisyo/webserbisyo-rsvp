import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const paymentsSource = readFileSync(
  new URL("../src/server/services/admin-workflow/payments.ts", import.meta.url),
  "utf8",
);
const clientsSource = readFileSync(
  new URL("../src/server/services/admin-workflow/clients.ts", import.meta.url),
  "utf8",
);
const rpcMigrationSource = readFileSync(
  new URL(
    "../supabase/migrations/20260810190000_phase6_atomic_mark_paid_rpc.sql",
    import.meta.url,
  ),
  "utf8",
);

test("Phase 6 RPC encapsulates payment paid state and client hosting mirror updates atomically", () => {
  assert.match(rpcMigrationSource, /create or replace function app_private\.mark_payment_paid_atomic/);
  assert.match(rpcMigrationSource, /update public\.payments/);
  assert.match(rpcMigrationSource, /payment_status = 'paid'/);
  assert.match(rpcMigrationSource, /update public\.clients/);
  assert.match(rpcMigrationSource, /status = 'active'/);
});

test("Phase 6 RPC fails safely if canonical client_id or event_id linkage is missing without repair", () => {
  assert.match(rpcMigrationSource, /if v_payment\.client_id is null or v_payment\.event_id is null then/);
  assert.match(
    rpcMigrationSource,
    /raise exception 'Cannot confirm payment: payment is missing linked client or event record\. Resolve provisioning first\.'/,
  );
  // Ensure RPC does not attempt to create client/event or repair application links
  assert.doesNotMatch(rpcMigrationSource, /insert into public\.clients/);
  assert.doesNotMatch(rpcMigrationSource, /insert into public\.rsvp_events/);
});

test("confirmManualPayment and markClientAsPaid invoke mark_payment_paid_atomic RPC for DB updates", () => {
  assert.match(paymentsSource, /\("mark_payment_paid_atomic",/);
  assert.match(clientsSource, /\("mark_payment_paid_atomic",/);
});

test("Meta Purchase CAPI telemetry remains strictly outside the DB transaction and payment errors do not rollback DB state", () => {
  assert.match(paymentsSource, /await sendMetaCapiPurchase\(\{/);
  assert.match(paymentsSource, /paymentId: updatedPayment\.id/);
  assert.match(clientsSource, /safeSendMetaCapiPurchase\(\{/);
  assert.match(clientsSource, /paymentId: payment\.id/);
});
