import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const { resolveMetaCapiRuntimeConfig } = await import("../src/lib/meta/capi-config-core.ts");
const { resolveMetaPixelForContext } = await import("../src/lib/meta/pixel-resolution.ts");

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
