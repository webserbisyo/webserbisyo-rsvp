import { expect, test } from "@playwright/test";
import { EVENT_WEBSITE_REORDER_UI_ENABLED } from "../src/config/event-website-capabilities";
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
  expect(eventWebsiteSectionContract).toHaveLength(16);
  expect(requiredEventWebsiteSectionKeys).toEqual([
    "host_info",
    "main_event",
    "venue",
    "rsvp_form",
  ]);
  expect(EVENT_WEBSITE_REORDER_UI_ENABLED).toBe(false);
});
