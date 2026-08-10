import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const { resolveMetaCapiRuntimeConfig } = await import("../src/lib/meta/capi-config-core.ts");
const { resolveMetaPixelForContext } = await import("../src/lib/meta/pixel-resolution.ts");
const { MetaAcquisitionEventSchema } = await import("../src/lib/meta/acquisition-events.ts");
const { getPurchaseEventTime } = await import("../src/lib/meta/purchase-event-time.ts");

const candidate = (overrides = {}) => ({
  id: "pixel-global",
  pixelId: "123456789012345",
  trackingScope: "global_public",
  updatedAt: "2026-08-10T00:00:00.000Z",
  ...overrides,
});

test("application funnel preserves a single global_public Pixel when it is the only match", () => {
  assert.equal(
    resolveMetaPixelForContext([candidate()], "application_funnel")?.pixelId,
    "123456789012345",
  );
});

test("application Pixels take precedence over global fallback and ignore rsvp_submit", () => {
  const resolved = resolveMetaPixelForContext(
    [
      candidate({ id: "rsvp", pixelId: "111111111111111", trackingScope: "rsvp_submit" }),
      candidate({ id: "global", pixelId: "222222222222222" }),
      candidate({ id: "application", pixelId: "333333333333333", trackingScope: "application" }),
    ],
    "application_funnel",
  );

  assert.equal(resolved?.id, "application");
});

test("same-scope Pixel resolution is deterministic", () => {
  const resolved = resolveMetaPixelForContext(
    [
      candidate({ id: "z", updatedAt: "2026-08-01T00:00:00.000Z" }),
      candidate({ id: "a", updatedAt: "2026-08-01T00:00:00.000Z" }),
    ],
    "application_funnel",
  );

  assert.equal(resolved?.id, "a");
});

test("Purchase remains enabled when its new flag is unset and can be explicitly disabled", () => {
  assert.equal(resolveMetaCapiRuntimeConfig({}).purchaseEnabled, true);
  assert.equal(
    resolveMetaCapiRuntimeConfig({ META_CAPI_PURCHASE_ENABLED: "false" }).purchaseEnabled,
    false,
  );
  assert.equal(
    resolveMetaCapiRuntimeConfig({ META_CAPI_PURCHASE_ENABLED: "true" }).purchaseEnabled,
    true,
  );
});

test("CAPI test code requires explicit test mode and warnings never include the code", () => {
  const inactive = resolveMetaCapiRuntimeConfig({
    META_CAPI_TEST_EVENT_CODE: "secret-test-code",
  });
  assert.equal(inactive.testEventCode, null);
  assert.deepEqual(inactive.warnings, ["meta_capi_test_code_ignored"]);
  assert.doesNotMatch(JSON.stringify(inactive.warnings), /secret-test-code/);

  const active = resolveMetaCapiRuntimeConfig({
    META_CAPI_TEST_EVENT_CODE: "secret-test-code",
    META_CAPI_TEST_MODE: "true",
  });
  assert.equal(active.testEventCode, "secret-test-code");
  assert.deepEqual(active.warnings, []);
});

test("Lead, Purchase, and test-mode controls remain independent", () => {
  const config = resolveMetaCapiRuntimeConfig({
    META_CAPI_LEAD_ENABLED: "true",
    META_CAPI_PURCHASE_ENABLED: "false",
    META_CAPI_TEST_EVENT_CODE: "test-code",
    META_CAPI_TEST_MODE: "true",
  });

  assert.equal(config.leadEnabled, true);
  assert.equal(config.purchaseEnabled, false);
  assert.equal(config.testEventCode, "test-code");
});

test("new acquisition CAPI flags default false while Lead and Purchase remain independent", () => {
  const config = resolveMetaCapiRuntimeConfig({
    META_CAPI_LEAD_ENABLED: "true",
    META_CAPI_PURCHASE_ENABLED: "true",
  });

  assert.equal(config.initiateCheckoutEnabled, false);
  assert.equal(config.selectPlanEnabled, false);
  assert.equal(config.startApplicationClickEnabled, false);
  assert.equal(config.contactEnabled, false);
  assert.equal(config.completeRegistrationEnabled, false);
  assert.equal(config.viewContentEnabled, false);
  assert.equal(config.pageViewEnabled, false);
  assert.equal(config.leadEnabled, true);
  assert.equal(config.purchaseEnabled, true);
});

test("InitiateCheckout handoff accepts only a UUID occurrence and validated application context", () => {
  const valid = MetaAcquisitionEventSchema.safeParse({
    eventId: "0f11aa2e-66ad-4c0f-8e52-9af2b69904da",
    eventName: "InitiateCheckout",
    fbp: "fb.1.1.123.456",
    plan: "pro",
    sourcePath: "/apply/start",
  });

  assert.equal(valid.success, true);
  assert.equal(
    MetaAcquisitionEventSchema.safeParse({ ...valid.data, eventId: "not-a-uuid" }).success,
    false,
  );
  assert.equal(
    MetaAcquisitionEventSchema.safeParse({ ...valid.data, sourcePath: "https://attacker.example" })
      .success,
    false,
  );
});

test("InitiateCheckout is hydrated-client-only and pairs the browser event with the handoff ID", () => {
  const trackerSource = readFileSync(
    new URL("../src/lib/meta/acquisition-tracker.ts", import.meta.url),
    "utf8",
  );
  const pageSource = readFileSync(
    new URL("../src/app/(public)/apply/start/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(trackerSource, /crypto\.randomUUID\(\)/);
  assert.match(trackerSource, /\{ eventID: eventId \}/);
  assert.match(trackerSource, /eventId,/);
  assert.match(trackerSource, /keepalive: true/);
  assert.match(pageSource, /<InitiateCheckoutTracker plan=\{initialPlan\} \/>/);
  assert.doesNotMatch(pageSource, /eventName="InitiateCheckout"/);
});

test("mid-funnel endpoint remains allowlisted, UUID-bound, and navigation-safe", () => {
  const schemaSource = readFileSync(
    new URL("../src/lib/meta/acquisition-events.ts", import.meta.url),
    "utf8",
  );
  const endpointSource = readFileSync(
    new URL("../src/app/api/meta/events/route.ts", import.meta.url),
    "utf8",
  );
  const trackerSource = readFileSync(
    new URL("../src/lib/meta/acquisition-tracker.ts", import.meta.url),
    "utf8",
  );

  assert.match(schemaSource, /z\.literal\("SelectPlan"\)/);
  assert.match(schemaSource, /z\.literal\("StartApplicationClick"\)/);
  assert.match(schemaSource, /z\.literal\("Contact"\)/);
  assert.match(endpointSource, /isAllowedMetaAcquisitionOrigin/);
  assert.match(endpointSource, /clientIpAddress/);
  assert.match(endpointSource, /clientUserAgent/);
  assert.match(trackerSource, /keepalive: true/);
  assert.doesNotMatch(schemaSource, /pixelId|actionSource|clientIpAddress|clientUserAgent/);
});

test("Lead keeps its deterministic browser/server event ID contract", () => {
  const leadSource = readFileSync(
    new URL("../src/server/services/send-meta-capi-lead.ts", import.meta.url),
    "utf8",
  );
  const successSource = readFileSync(
    new URL("../src/app/(public)/apply/success/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(leadSource, /return `\$\{META_CAPI_LEAD_EVENT_NAME\}:\$\{referenceCode\}`/);
  assert.match(successSource, /`Lead:\$\{referenceCode\}`/);
  assert.match(leadSource, /action_source: "website"/);
});

test("Purchase delivery migration has one atomic logical-delivery identity and recovery states", () => {
  const migration = readFileSync(
    new URL(
      "../supabase/migrations/20260810120000_create_meta_capi_deliveries.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(migration, /unique \(provider, event_name, event_id\)/);
  assert.match(migration, /status in \('pending', 'sending', 'sent', 'failed'\)/);
  assert.match(migration, /on conflict \(provider, event_name, event_id\) do update/);
  assert.match(migration, /status = 'failed'/);
  assert.match(migration, /status = 'sending'/);
  assert.match(migration, /claim_token/);
  assert.match(migration, /enable row level security/);
});

test("Purchase event time uses the persisted paid_at instant across later sends and retries", () => {
  const paidAt = "2026-08-09T10:30:00.000Z";
  const persistedSeconds = 1_786_271_400;

  assert.equal(getPurchaseEventTime(paidAt, Date.parse("2026-08-10T00:00:00.000Z")), persistedSeconds);
  assert.equal(getPurchaseEventTime(paidAt, Date.parse("2026-08-12T00:00:00.000Z")), persistedSeconds);
});

test("Purchase event time safely falls back only for missing or malformed paid_at", () => {
  const fallbackNow = Date.parse("2026-08-10T00:00:00.000Z");
  assert.equal(getPurchaseEventTime(null, fallbackNow), Math.floor(fallbackNow / 1000));
  assert.equal(getPurchaseEventTime("not-a-date", fallbackNow), Math.floor(fallbackNow / 1000));
});

test("Purchase uses manual-payment source semantics without administrator browser context", () => {
  const purchaseSource = readFileSync(
    new URL("../src/server/services/send-meta-capi-purchase.ts", import.meta.url),
    "utf8",
  );
  const clientActionSource = readFileSync(
    new URL("../src/server/actions/admin-clients.ts", import.meta.url),
    "utf8",
  );
  const salesActionSource = readFileSync(
    new URL("../src/server/actions/admin-sales.ts", import.meta.url),
    "utf8",
  );

  assert.match(purchaseSource, /const eventId = `Purchase:\$\{input\.paymentId\}`/);
  assert.match(purchaseSource, /actionSource: "other"/);
  assert.match(purchaseSource, /currency: input\.currency/);
  assert.match(purchaseSource, /eventTime: getPurchaseEventTime\(input\.paidAt\)/);
  assert.doesNotMatch(purchaseSource, /clientIpAddress|clientUserAgent|sourceUrl/);
  assert.doesNotMatch(clientActionSource, /headers\(\)|clientIpAddress|clientUserAgent/);
  assert.doesNotMatch(salesActionSource, /headers\(\)|clientIpAddress|clientUserAgent/);
});

test("Purchase flag and delivery completion remain separate from payment business errors", () => {
  const purchaseSource = readFileSync(
    new URL("../src/server/services/send-meta-capi-purchase.ts", import.meta.url),
    "utf8",
  );
  const paymentSource = readFileSync(
    new URL("../src/server/services/admin-workflow/payments.ts", import.meta.url),
    "utf8",
  );

  assert.match(purchaseSource, /if \(!config\.purchaseEnabled\)/);
  assert.match(purchaseSource, /claimMetaCapiPurchaseDelivery/);
  assert.match(purchaseSource, /completeMetaCapiPurchaseDelivery/);
  assert.match(purchaseSource, /meta_capi_purchase_claimed/);
  assert.match(paymentSource, /CAPI telemetry must never fail the payment confirmation/);
});

test("Admin Meta diagnostics expose durable Purchase delivery state without secret values", () => {
  const adminQuerySource = readFileSync(
    new URL("../src/server/queries/admin-pixels.ts", import.meta.url),
    "utf8",
  );

  assert.match(adminQuerySource, /from\("meta_capi_deliveries"\)/);
  assert.match(adminQuerySource, /case "sending":/);
  assert.match(adminQuerySource, /purchaseEnabled/);
  assert.match(adminQuerySource, /configurationWarnings/);
  assert.doesNotMatch(adminQuerySource, /META_CAPI_TEST_EVENT_CODE/);
});
