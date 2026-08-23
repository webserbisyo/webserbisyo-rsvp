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
  assert.equal(presets[3].layout.enabledSections.godparents, true);
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

  // Canonical wedding order matches getDefaultWeddingSectionOrder()
  assert.deepEqual(parsed.layout.sectionOrder, defaults.getDefaultWeddingSectionOrder());

  // Saved toggles preserved
  assert.equal(parsed.layout.enabledSections.main_event, true);
  assert.equal(parsed.layout.enabledSections.venue, true);
  assert.equal(parsed.layout.enabledSections.gallery, false);

  // Idempotency check: repeat hydration on already hydrated content yields same result
  const repeated = hydration.parseEventWebsiteContentJson(parsed);
  assert.deepEqual(repeated, parsed);
});

test("scrambled legacy wedding sectionOrder hydrates to canonical wedding order while preserving enabledSections and content", async () => {
  const { defaults, hydration } = await loadEventWebsiteModules();
  const weddingPreset = defaults.buildDefaultWeddingEventWebsiteContent();

  // Scrambled historical order: venue before main_event, gallery before music_effects
  const scrambledOrder = [
    "host_info",
    "countdown",
    "venue",
    "main_event",
    "gallery",
    "music_effects",
    "secondary_event",
    "timeline_program",
    "entourage",
    "principal_sponsors",
    "attire_motif",
    "extra_info",
    "rsvp_form",
    "gift_details",
    "guestbook",
    "story_message",
    "contact_socials",
    "eighteen_roses_candles",
    "debut_court",
    "godparents",
  ];

  const legacyScrambledSnapshot = {
    ...weddingPreset,
    layout: {
      enabledSections: {
        ...weddingPreset.layout.enabledSections,
        gallery: false,
        music_effects: true,
        venue: true,
        main_event: true,
      },
      sectionOrder: scrambledOrder,
    },
    sections: {
      ...weddingPreset.sections,
      host_info: {
        ...weddingPreset.sections.host_info,
        groomName: "Alexander",
        brideName: "Maria",
      },
    },
  };

  const hydrated = hydration.parseEventWebsiteContentJson(legacyScrambledSnapshot);
  assert.notEqual(hydrated, null);

  // Enforces canonical wedding section order
  assert.deepEqual(hydrated.layout.sectionOrder, defaults.getDefaultWeddingSectionOrder());
  assert.equal(hydrated.layout.sectionOrder[2], "music_effects");
  assert.equal(hydrated.layout.sectionOrder[3], "gallery");
  assert.equal(hydrated.layout.sectionOrder[4], "main_event");
  assert.equal(hydrated.layout.sectionOrder[5], "venue");

  // Preserves enabledSections toggles exactly
  assert.equal(hydrated.layout.enabledSections.gallery, false);
  assert.equal(hydrated.layout.enabledSections.music_effects, true);
  assert.equal(hydrated.layout.enabledSections.venue, true);
  assert.equal(hydrated.layout.enabledSections.main_event, true);

  // Preserves section content
  assert.equal(hydrated.sections.host_info.groomName, "Alexander");
  assert.equal(hydrated.sections.host_info.brideName, "Maria");
});

test("wedding save patch normalizes to canonical wedding section order", async () => {
  const { defaults, hydration } = await loadEventWebsiteModules();

  const patch = {
    eventType: "wedding",
    layout: {
      enabledSections: {
        gallery: false,
        music_effects: true,
      },
      sectionOrder: ["venue", "host_info", "countdown", "main_event"],
    },
    sections: {
      host_info: {
        kind: "wedding",
        groomName: "Alexander",
        brideName: "Maria",
      },
    },
  };

  const normalized = hydration.normalizeEventWebsiteContentForSave(patch, {
    event: { eventType: "wedding" },
  });

  assert.deepEqual(normalized.layout.sectionOrder, defaults.getDefaultWeddingSectionOrder());
  assert.equal(normalized.layout.enabledSections.gallery, false);
  assert.equal(normalized.layout.enabledSections.music_effects, true);
});

test("non-wedding event types preserve custom section order during hydration and resolve", async () => {
  const { defaults, hydration } = await loadEventWebsiteModules();
  const debutPreset = defaults.buildDefaultDebutEventWebsiteContent();

  const customDebutOrder = [
    "host_info",
    "countdown",
    "eighteen_roses_candles",
    "debut_court",
    "music_effects",
    "gallery",
    "main_event",
    "venue",
    "secondary_event",
    "timeline_program",
    "entourage",
    "principal_sponsors",
    "attire_motif",
    "extra_info",
    "rsvp_form",
    "gift_details",
    "guestbook",
    "story_message",
    "contact_socials",
    "godparents",
  ];

  const debutSnapshot = {
    ...debutPreset,
    eventType: "debut",
    layout: {
      enabledSections: debutPreset.layout.enabledSections,
      sectionOrder: customDebutOrder,
    },
  };

  const hydratedDebut = hydration.parseEventWebsiteContentJson(debutSnapshot);
  assert.notEqual(hydratedDebut, null);
  assert.equal(hydratedDebut.layout.sectionOrder[2], "eighteen_roses_candles");
  assert.equal(hydratedDebut.layout.sectionOrder[3], "debut_court");

  const resolvedOrder = defaults.resolveEventWebsiteSectionOrder({
    eventType: "debut",
    storedSectionOrder: customDebutOrder,
  });
  assert.equal(resolvedOrder[2], "eighteen_roses_candles");
  assert.equal(resolvedOrder[3], "debut_court");
});

test("autosave canonical validation rejects rsvp deadline after ceremony start", async () => {
  const { EventWebsiteCanonicalEventPatchSchema } =
    await import("../src/lib/validations/event-website.schema.ts");

  const validCanonicalPatch = {
    event_date: "2026-06-06",
    event_time: "16:00",
    rsvp_close_at: "2026-06-01T16:00:00+08:00",
    venue_name: "The Ruins, Bacolod",
    venue_address: "Talisay City",
  };
  const validResult = EventWebsiteCanonicalEventPatchSchema.safeParse(validCanonicalPatch);
  assert.equal(validResult.success, true);

  const invalidCanonicalPatch = {
    event_date: "2026-06-06",
    event_time: "16:00",
    rsvp_close_at: "2026-06-10T16:00:00+08:00", // after ceremony start!
    venue_name: "The Ruins, Bacolod",
    venue_address: "Talisay City",
  };
  const invalidResult = EventWebsiteCanonicalEventPatchSchema.safeParse(invalidCanonicalPatch);
  assert.equal(invalidResult.success, false);
  assert.equal(
    invalidResult.error.issues[0].message,
    "RSVP deadline must be on or before the ceremony start.",
  );
});
