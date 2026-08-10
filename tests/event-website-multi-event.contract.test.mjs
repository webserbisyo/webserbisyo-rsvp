import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const targetSectionKeys = ["eighteen_roses_candles", "debut_court", "godparents"];

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href, context);
    }

    return nextResolve(specifier, context);
  },
});

async function loadEventWebsiteModules() {
  const [defaults, hydration, types] = await Promise.all([
    import("../src/lib/event-website/defaults.ts"),
    import("../src/lib/event-website/hydration.ts"),
    import("../src/lib/event-website/types.ts"),
  ]);

  return { defaults, hydration, types };
}

function readSectionContract() {
  return JSON.parse(source("contracts/event-website-sections.v1.json"));
}

function assertCanonicalSectionOrder(sectionOrder, canonicalSectionKeys) {
  assert.equal(sectionOrder.length, canonicalSectionKeys.length);
  assert.equal(new Set(sectionOrder).size, canonicalSectionKeys.length);
  assert.deepEqual(new Set(sectionOrder), new Set(canonicalSectionKeys));
}

test("event website content contract supports every built-in event type", () => {
  const types = source("src/lib/event-website/types.ts");
  const schema = source("src/lib/validations/event-website.schema.ts");
  assert.match(types, /"wedding",\s*"birthday",\s*"debut",\s*"baptism"/s);
  assert.match(schema, /z\.enum\(eventWebsiteContentEventTypes\)/);
  assert.match(schema, /z\.discriminatedUnion\("kind"/);
});

test("target presets are event-aware and avoid Wedding host fields", () => {
  const defaults = source("src/lib/event-website/defaults.ts");
  for (const builder of [
    "buildDefaultBirthdayEventWebsiteContent",
    "buildDefaultDebutEventWebsiteContent",
    "buildDefaultBaptismEventWebsiteContent",
  ])
    assert.match(defaults, new RegExp(`function ${builder}`));
  assert.match(defaults, /celebrantName: ""/);
  assert.match(defaults, /debutantName: ""/);
  assert.match(defaults, /childName: ""/);
  assert.match(defaults, /eighteen_roses_candles: \{ groups: \[\] \}/);
  assert.match(defaults, /godparents: \{ groups: \[\] \}/);
});

test("the versioned section contract exactly matches the canonical content keys", async () => {
  const { types } = await loadEventWebsiteModules();
  const contract = readSectionContract();
  const contractKeys = contract.sections.map((section) => section.key);
  const canonicalSectionKeys = types.eventWebsiteContentSectionKeys;

  assert.equal(contract.contractVersion, 1);
  assert.equal(contractKeys.length, 20);
  assert.equal(new Set(contractKeys).size, contractKeys.length);
  assert.deepEqual(new Set(contractKeys), new Set(canonicalSectionKeys));

  for (const key of targetSectionKeys) {
    assert.equal(contractKeys.filter((contractKey) => contractKey === key).length, 1);
  }
});

test("all preset builders retain the canonical section order and visibility contract", async () => {
  const { defaults, hydration, types } = await loadEventWebsiteModules();
  const presets = [
    defaults.buildDefaultWeddingEventWebsiteContent(),
    defaults.buildDefaultBirthdayEventWebsiteContent(),
    defaults.buildDefaultDebutEventWebsiteContent(),
    defaults.buildDefaultBaptismEventWebsiteContent(),
  ];

  for (const preset of presets) {
    assertCanonicalSectionOrder(preset.layout.sectionOrder, types.eventWebsiteContentSectionKeys);
    assert.doesNotThrow(() => hydration.validateEventWebsiteContentForPersistence(preset));
  }

  const wedding = presets[0];
  for (const key of targetSectionKeys) assert.equal(wedding.layout.enabledSections[key], false);
  assert.equal(presets[1].layout.enabledSections.eighteen_roses_candles, false);
  assert.equal(presets[2].layout.enabledSections.eighteen_roses_candles, true);
  assert.equal(presets[2].layout.enabledSections.debut_court, false);
  assert.equal(presets[3].layout.enabledSections.godparents, false);
});

test("hydration and saving select defaults by event type", () => {
  const hydration = source("src/lib/event-website/hydration.ts");
  assert.match(
    hydration,
    /buildDefaultEventWebsiteContent\(context\.event\?\.eventType, context\)/,
  );
  assert.match(hydration, /buildDefaultEventWebsiteContent\(eventType\)/);
});

test("renderer has target host and special-section routes", () => {
  const renderer = source("src/components/event-website/event-website-renderer.tsx");
  assert.match(renderer, /hostInfo\.kind !== "wedding"/);
  assert.match(renderer, /eighteen_roses_candles/);
  assert.match(renderer, /debut_court/);
  assert.match(renderer, /godparents/);
});

test("legacy 17-key and 16-key stored snapshots hydrate cleanly to 20-section schema", async () => {
  const { defaults, hydration, types } = await loadEventWebsiteModules();
  const weddingPreset = defaults.buildDefaultWeddingEventWebsiteContent();

  const legacy17Snapshot = {
    version: 1,
    eventType: "wedding",
    layout: {
      enabledSections: Object.fromEntries(
        types.eventWebsiteContentSectionKeys
          .slice(0, 17)
          .map((key) => [key, key === "main_event" || key === "venue"]),
      ),
      sectionOrder: types.eventWebsiteContentSectionKeys.slice(0, 17),
    },
    meta: { savedAt: null, savedBy: null },
    sections: Object.fromEntries(
      types.eventWebsiteContentSectionKeys
        .slice(0, 17)
        .map((key) => [key, weddingPreset.sections[key]]),
    ),
    assets: {},
  };

  const parsed = hydration.parseEventWebsiteContentJson(legacy17Snapshot);
  assert.notEqual(parsed, null);
  assert.equal(parsed.layout.sectionOrder.length, 20);
  assert.equal(new Set(parsed.layout.sectionOrder).size, 20);

  // Preserve relative order of existing 17 keys
  for (let i = 0; i < 17; i += 1) {
    assert.equal(parsed.layout.sectionOrder[i], types.eventWebsiteContentSectionKeys[i]);
  }

  // Missing 3 keys appended at end
  const missingKeys = ["eighteen_roses_candles", "debut_court", "godparents"];
  for (const key of missingKeys) {
    assert.equal(parsed.layout.enabledSections[key], false);
    assert.ok(parsed.layout.sectionOrder.includes(key));
    assert.ok(parsed.sections[key] !== undefined);
  }

  // Saved toggles preserved
  assert.equal(parsed.layout.enabledSections.main_event, true);
  assert.equal(parsed.layout.enabledSections.venue, true);

  // Idempotency check: repeat hydration on already hydrated content yields same result
  const repeated = hydration.parseEventWebsiteContentJson(parsed);
  assert.deepEqual(repeated, parsed);
});
