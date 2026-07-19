import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { EVENT_WEBSITE_REORDER_UI_ENABLED } from "../src/config/event-website-capabilities";
import { buildDefaultWeddingEventWebsiteContent } from "../src/lib/event-website/defaults";
import { isCustomWebsiteUnavailableHtml } from "../src/lib/event-website/custom-website-health-policy";
import {
  getEventWebsiteContentIssuePaths,
  isEmptyJsonObject,
  normalizeEventWebsiteContentForSave,
  parseEventWebsiteContentJson,
  validateEventWebsiteContentJson,
  validateEventWebsiteContentForPersistence,
} from "../src/lib/event-website/hydration";
import {
  getAutosaveRetryDelay,
  getPublicationRevisionState,
  shouldAcknowledgeClientSequence,
  shouldAdoptEventWebsiteServerSnapshot,
} from "../src/lib/event-website/autosave-policy";
import {
  EVENT_WEBSITE_SECTION_CONTRACT_VERSION,
  eventWebsiteSectionContract,
  requiredEventWebsiteSectionKeys,
} from "../src/lib/event-website/section-contract";

test("autosave retries use bounded exponential backoff", () => {
  expect([1, 2, 3, 4].map(getAutosaveRetryDelay)).toEqual([1_000, 2_000, 4_000, 4_000]);
});

test("dirty, saving, error, and conflict editors reject server rehydration", () => {
  for (const persistenceState of ["saving", "retrying", "error", "conflict"] as const) {
    expect(
      shouldAdoptEventWebsiteServerSnapshot({
        currentEventId: "event-a",
        incomingEventId: "event-a",
        isDirty: persistenceState === "saving",
        persistenceState,
      }),
    ).toBe(false);
  }

  expect(
    shouldAdoptEventWebsiteServerSnapshot({
      currentEventId: "event-a",
      incomingEventId: "event-a",
      isDirty: true,
      persistenceState: "unsaved",
    }),
  ).toBe(false);
});

test("only current or newer client acknowledgements advance the baseline", () => {
  expect(shouldAcknowledgeClientSequence(4, 3)).toBe(false);
  expect(shouldAcknowledgeClientSequence(4, 4)).toBe(true);
  expect(shouldAcknowledgeClientSequence(4, 5)).toBe(true);
});

test("publication state is independent from unsaved browser state", () => {
  expect(
    getPublicationRevisionState({
      isPublished: true,
      publishedRevision: 4,
      savedRevision: 4,
    }),
  ).toBe("published");
  expect(
    getPublicationRevisionState({
      isPublished: true,
      publishedRevision: 3,
      savedRevision: 4,
    }),
  ).toBe("draft_changes_not_published");
  expect(
    getPublicationRevisionState({
      isPublished: false,
      publishedRevision: 0,
      savedRevision: 4,
    }),
  ).toBe("not_published");
});

test("section contract is versioned and reorder UI is centrally disabled", () => {
  expect(EVENT_WEBSITE_SECTION_CONTRACT_VERSION).toBe(1);
  expect(eventWebsiteSectionContract).toHaveLength(17);
  expect(requiredEventWebsiteSectionKeys).toEqual([
    "host_info",
    "main_event",
    "venue",
    "rsvp_form",
  ]);
  expect(EVENT_WEBSITE_REORDER_UI_ENABLED).toBe(false);
});

test("complete event content rejects visibility nested under any section", () => {
  const valid = buildDefaultWeddingEventWebsiteContent();
  expect(() => validateEventWebsiteContentForPersistence(valid)).not.toThrow();

  for (const sectionKey of Object.keys(valid.sections)) {
    const malformed = structuredClone(valid) as Record<string, unknown>;
    const sections = malformed.sections as Record<string, Record<string, unknown>>;
    sections[sectionKey] = { ...sections[sectionKey], enabled: true };

    expect(() => validateEventWebsiteContentForPersistence(malformed)).toThrow();
    expect(getEventWebsiteContentIssuePaths(malformed)).toContain(`sections.${sectionKey}`);
  }
});

test("visibility remains valid only in the canonical layout map", () => {
  const valid = buildDefaultWeddingEventWebsiteContent();
  valid.layout.enabledSections.music_effects = false;
  expect(validateEventWebsiteContentForPersistence(valid).layout.enabledSections.music_effects).toBe(
    false,
  );

  const unknownKey = structuredClone(valid) as typeof valid & {
    layout: { enabledSections: Record<string, boolean> };
  };
  unknownKey.layout.enabledSections.unknown_section = true;
  expect(() => validateEventWebsiteContentForPersistence(unknownKey)).toThrow();
});

test("service validation precedes every privileged draft write", () => {
  const source = readFileSync(
    new URL("../src/server/services/save-event-website-draft.ts", import.meta.url),
    "utf8",
  );
  expect(source.indexOf("validateEventWebsiteContentJson(input.content)")).toBeGreaterThan(-1);
  expect(source.indexOf("validateEventWebsiteContentJson(input.content)")).toBeLessThan(
    source.indexOf("createAdminClient()"),
  );
});

test("persisted malformed content cannot silently adopt sample defaults", () => {
  const source = readFileSync(
    new URL("../src/server/queries/dashboard-event.ts", import.meta.url),
    "utf8",
  );
  expect(source).toContain("hasInvalidPersistedContent");
  expect(source).toContain("eventWebsiteContent = hasInvalidPersistedContent");
  expect(source).not.toContain("parsedContentJson ?? rawContentJson");
});

test("exact legacy 16-key content upgrades Gallery without changing existing data", () => {
  const legacy = buildLegacyEventWebsiteContent();
  const originalOrder = [...legacy.layout.sectionOrder];
  legacy.layout.enabledSections.music_effects = false;
  legacy.sections.host_info = {
    ...(legacy.sections.host_info as Record<string, unknown>),
    brideName: "Isabella",
    groomName: "Rafael",
  };

  const parsed = parseEventWebsiteContentJson(legacy);
  expect(parsed).not.toBeNull();
  expect(validateEventWebsiteContentJson(legacy).success).toBe(true);
  expect(parsed?.layout.enabledSections.gallery).toBe(false);
  expect(parsed?.sections.gallery).toEqual({
    sectionIntro: "Photo highlights and visual memories.",
    sectionTitle: "Gallery",
  });
  expect(parsed?.sections.host_info.brideName).toBe("Isabella");
  expect(parsed?.sections.host_info.groomName).toBe("Rafael");
  expect(parsed?.layout.enabledSections.music_effects).toBe(false);

  const contactIndex = originalOrder.indexOf("contact_socials");
  const expectedOrder = [
    ...originalOrder.slice(0, contactIndex),
    "gallery",
    ...originalOrder.slice(contactIndex),
  ];
  expect(parsed?.layout.sectionOrder).toEqual(expectedOrder);

  expect(legacy.layout.enabledSections.gallery).toBeUndefined();
  expect(legacy.sections.gallery).toBeUndefined();
  expect(legacy.layout.sectionOrder).toEqual(originalOrder);
});

test("legacy Gallery compatibility does not hide other malformed content", () => {
  const missingSection = buildLegacyEventWebsiteContent();
  delete missingSection.sections.venue;
  expect(parseEventWebsiteContentJson(missingSection)).toBeNull();

  const missingOrderKey = buildLegacyEventWebsiteContent();
  missingOrderKey.layout.sectionOrder = missingOrderKey.layout.sectionOrder.filter(
    (key) => key !== "contact_socials",
  );
  expect(parseEventWebsiteContentJson(missingOrderKey)).toBeNull();

  const unknownKey = buildLegacyEventWebsiteContent();
  unknownKey.sections.unknown_section = {};
  expect(parseEventWebsiteContentJson(unknownKey)).toBeNull();

  const nestedVisibility = buildLegacyEventWebsiteContent();
  nestedVisibility.sections.host_info = {
    ...(nestedVisibility.sections.host_info as Record<string, unknown>),
    enabled: true,
  };
  expect(parseEventWebsiteContentJson(nestedVisibility)).toBeNull();

  expect(parseEventWebsiteContentJson(null)).toBeNull();
  expect(parseEventWebsiteContentJson([])).toBeNull();
});

test("an HTTP 200 branded unavailable page is not considered healthy content", () => {
  expect(
    isCustomWebsiteUnavailableHtml(
      "<html><body><h1>Event unavailable</h1><p>Published event not found.</p></body></html>",
    ),
  ).toBe(true);
  expect(isCustomWebsiteUnavailableHtml("<html><body><main>Wedding website</main></body></html>"))
    .toBe(false);
});

test("save normalization accepts patch-shaped content and returns valid full structure", () => {
  const patch = {
    layout: {
      enabledSections: {
        music_effects: false,
      },
    },
    sections: {
      host_info: {
        brideName: "Isabella",
        groomName: "Rafael",
      },
    },
  };
  const normalized = normalizeEventWebsiteContentForSave(patch);
  expect(normalized.layout.enabledSections.music_effects).toBe(false);
  expect(normalized.sections.host_info.brideName).toBe("Isabella");
  expect(normalized.sections.main_event.eventDate).toBeDefined();
});

test("isEmptyJsonObject identifies uninitialized empty objects", () => {
  expect(isEmptyJsonObject({})).toBe(true);
  expect(isEmptyJsonObject({ foo: "bar" })).toBe(false);
  expect(isEmptyJsonObject(null)).toBe(false);
  expect(isEmptyJsonObject([])).toBe(false);
});

function buildLegacyEventWebsiteContent() {
  const current = buildDefaultWeddingEventWebsiteContent();
  const legacy = structuredClone(current) as unknown as {
    layout: {
      enabledSections: Record<string, boolean>;
      sectionOrder: string[];
    };
    sections: Record<string, unknown>;
  };

  delete legacy.layout.enabledSections.gallery;
  delete legacy.sections.gallery;
  legacy.layout.sectionOrder = legacy.layout.sectionOrder.filter((key) => key !== "gallery");

  return legacy;
}
