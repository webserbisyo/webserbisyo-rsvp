import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { EVENT_WEBSITE_REORDER_UI_ENABLED } from "../src/config/event-website-capabilities";
import { resolveEventWebsiteSections } from "../src/config/event-website-sections";
import { buildDefaultWeddingEventWebsiteContent } from "../src/lib/event-website/defaults";
import { isCustomWebsiteUnavailableHtml } from "../src/lib/event-website/custom-website-health-policy";
import {
  buildPublicEventDto,
  buildPublicRenderableSections,
} from "../src/lib/event-website/public-event";
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
  DraftSaveController,
  type DraftSaveReason,
  type DraftSaveResponse,
} from "../src/lib/event-website/draft-save-controller";
import {
  assertSafeEventWebsiteDraftMergeValue,
  mergeEventWebsiteDraftThreeWay,
} from "../src/lib/event-website/draft-three-way-merge";
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
  expect(eventWebsiteSectionContract).toHaveLength(20);
  expect(requiredEventWebsiteSectionKeys).toEqual([
    "host_info",
    "main_event",
    "venue",
    "rsvp_form",
  ]);
  expect(EVENT_WEBSITE_REORDER_UI_ENABLED).toBe(false);
});

test("Gallery is canonical, disabled by default, and ordered immediately after Music", () => {
  const content = buildDefaultWeddingEventWebsiteContent();
  const sections = resolveEventWebsiteSections("wedding");
  const gallery = sections.optionalSections.find((section) => section.key === "gallery");
  const styleTheme = sections.futureDevelopmentSections.find(
    (section) => section.key === "style_theme",
  );

  expect(Object.keys(content.layout.enabledSections)).toHaveLength(20);
  expect(content.layout.enabledSections.gallery).toBe(false);
  expect(content.layout.sectionOrder.indexOf("gallery")).toBe(
    content.layout.sectionOrder.indexOf("music_effects") + 1,
  );
  expect(gallery).toMatchObject({
    comingSoon: true,
    defaultEnabled: false,
    toggleableWhenComingSoon: true,
  });
  expect(styleTheme?.toggleableWhenComingSoon).not.toBe(true);
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
  expect(
    validateEventWebsiteContentForPersistence(valid).layout.enabledSections.music_effects,
  ).toBe(false);

  const unknownKey = structuredClone(valid) as typeof valid & {
    layout: { enabledSections: Record<string, boolean> };
  };
  unknownKey.layout.enabledSections.unknown_section = true;
  expect(() => validateEventWebsiteContentForPersistence(unknownKey)).toThrow();
});

test("service validation precedes every privileged draft write", () => {
  const source = readFileSync(
    join(process.cwd(), "src/server/services/save-event-website-draft.ts"),
    "utf8",
  );
  expect(source.indexOf("validateEventWebsiteContentJson(input.content)")).toBeGreaterThan(-1);
  expect(source.indexOf("validateEventWebsiteContentJson(input.content)")).toBeLessThan(
    source.indexOf("createAdminClient()"),
  );
});

test("persisted malformed content cannot silently adopt sample defaults", () => {
  const source = readFileSync(join(process.cwd(), "src/server/queries/dashboard-event.ts"), "utf8");
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

  const musicIndex = originalOrder.indexOf("music_effects");
  const expectedOrder = [
    ...originalOrder.slice(0, musicIndex + 1),
    "gallery",
    ...originalOrder.slice(musicIndex + 1),
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

  const missingMusic = buildLegacyEventWebsiteContent();
  missingMusic.layout.sectionOrder = missingMusic.layout.sectionOrder.filter(
    (key) => key !== "music_effects",
  );
  expect(parseEventWebsiteContentJson(missingMusic)).toBeNull();

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
  expect(
    isCustomWebsiteUnavailableHtml("<html><body><main>Wedding website</main></body></html>"),
  ).toBe(false);
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

test("Gallery visibility survives normalization and controls public rendering", () => {
  const enabled = normalizeEventWebsiteContentForSave({
    layout: { enabledSections: { gallery: true } },
  });
  expect(enabled.layout.enabledSections.gallery).toBe(true);
  expect(buildPublicRenderableSections(enabled, "wedding")).toContain("gallery");
  const publicEvent = buildPublicEventDto({
    content: enabled,
    eventDate: "2026-06-20",
    eventSlug: "gallery-lifecycle-test",
    eventTime: "16:00",
    eventTitle: "Gallery lifecycle test",
    eventType: "wedding",
    guestbookMessages: [],
    publishedAt: "2026-06-01T00:00:00.000Z",
    publishedRevision: 1,
    rsvpCloseAt: null,
    rsvpOpenAt: null,
    savedRevision: 1,
    subdomainSlug: null,
    venueAddress: null,
    venueName: null,
    visibility: "public",
  });
  expect(publicEvent.sectionsByKey.gallery).toEqual(enabled.sections.gallery);

  const disabled = normalizeEventWebsiteContentForSave({
    layout: { enabledSections: { gallery: false } },
  });
  expect(disabled.layout.enabledSections.gallery).toBe(false);
  expect(buildPublicRenderableSections(disabled, "wedding")).not.toContain("gallery");
});

test("isEmptyJsonObject identifies uninitialized empty objects", () => {
  expect(isEmptyJsonObject({})).toBe(true);
  expect(isEmptyJsonObject({ foo: "bar" })).toBe(false);
  expect(isEmptyJsonObject(null)).toBe(false);
  expect(isEmptyJsonObject([])).toBe(false);
});

type TestDraft = { body: string; title: string; tags?: string[] };
type TestPersist = (input: {
  content: TestDraft;
  expectedRevision: number;
  mutationId: string;
  reason: DraftSaveReason;
  saveAttemptId: number;
}) => Promise<DraftSaveResponse<TestDraft>>;
type TestScheduler = {
  clear: (timer: ReturnType<typeof setTimeout>) => void;
  set: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
};

class ManualScheduler {
  private callbacks = new Map<number, () => void>();
  private nextId = 0;
  clear = (timer: ReturnType<typeof setTimeout>) => {
    this.callbacks.delete(Number(timer));
  };
  set = (callback: () => void) => {
    const id = ++this.nextId;
    this.callbacks.set(id, callback);
    return id as unknown as ReturnType<typeof setTimeout>;
  };
  runAll() {
    const callbacks = [...this.callbacks.values()];
    this.callbacks.clear();
    callbacks.forEach((callback) => callback());
  }
  get size() {
    return this.callbacks.size;
  }
}

function createController(input?: {
  autoSaveEnabled?: boolean;
  persist?: TestPersist;
  scheduler?: TestScheduler;
}) {
  const scheduler = input?.scheduler ?? new ManualScheduler();
  const calls: Array<{ content: TestDraft; expectedRevision: number; mutationId: string; reason: string }> = [];
  const controller = new DraftSaveController<TestDraft>({
    autoSaveEnabled: input?.autoSaveEnabled ?? true,
    debounceMs: 1,
    initialContent: { body: "base", title: "base" },
    initialSavedAt: "2026-01-01T00:00:00.000Z",
    initialSavedRevision: 7,
    persist:
      input?.persist ??
      (async (request) => {
        calls.push(request);
        return { savedAt: "2026-01-02T00:00:00.000Z", savedRevision: 8, status: "saved" };
      }),
    scheduler,
  });
  return { calls, controller, scheduler };
}

test("disabling auto-save cancels a pending debounce and a stale callback rechecks the toggle", async () => {
  const scheduler = new ManualScheduler();
  const { calls, controller } = createController({ scheduler });
  controller.updateDraft({ body: "local", title: "base" });
  expect(scheduler.size).toBe(1);
  controller.setAutoSaveEnabled(false);
  expect(scheduler.size).toBe(0);
  (scheduler as ManualScheduler).runAll();
  await Promise.resolve();
  expect(calls).toHaveLength(0);

  // A scheduler that cannot cancel an already-dispatched callback must still not save.
  let callback: (() => void) | undefined;
  const uncancellable = {
    clear: () => undefined,
    set: (next: () => void) => {
      callback = next;
      return 1 as unknown as ReturnType<typeof setTimeout>;
    },
  };
  const second = createController({ scheduler: uncancellable });
  second.controller.updateDraft({ body: "local", title: "base" });
  second.controller.setAutoSaveEnabled(false);
  callback?.();
  await Promise.resolve();
  expect(second.calls).toHaveLength(0);
});

test("manual Save consumes debounce and persists the latest rendered draft through the shared path", async () => {
  const { calls, controller, scheduler } = createController();
  controller.updateDraft({ body: "first", title: "base" });
  controller.updateDraft({ body: "latest", title: "base" });
  await controller.saveNow();
  (scheduler as ManualScheduler).runAll();
  await Promise.resolve();
  expect(calls).toHaveLength(1);
  expect(calls[0]).toMatchObject({ content: { body: "latest", title: "base" }, reason: "manual" });
  expect(controller.getState()).toMatchObject({
    isDirty: false,
    savedRevision: 8,
    status: "clean",
  });
});

test("auto-save and manual Save use the same serialized persistence controller", async () => {
  const { calls, controller, scheduler } = createController();
  controller.updateDraft({ body: "auto", title: "base" });
  (scheduler as ManualScheduler).runAll();
  await Promise.resolve();
  controller.updateDraft({ body: "manual", title: "base" });
  await controller.saveNow();
  expect(calls.map((call) => call.reason)).toEqual(["auto", "manual"]);
  expect(calls.map((call) => call.expectedRevision)).toEqual([7, 8]);
});

test("rapid edits coalesce and only one request is active while later edits are queued", async () => {
  let active = 0;
  let maxActive = 0;
  const resolvers: Array<
    (value: { savedAt: string; savedRevision: number; status: "saved" }) => void
  > = [];
  const calls: Array<{ content: TestDraft; expectedRevision: number }> = [];
  const { controller } = createController({
    autoSaveEnabled: false,
    persist: (request) =>
      new Promise((resolve) => {
        calls.push(request);
        active += 1;
        maxActive = Math.max(maxActive, active);
        resolvers.push((value) => {
          active -= 1;
          resolve(value);
        });
      }),
  });
  controller.updateDraft({ body: "one", title: "base" });
  const saving = controller.saveNow();
  controller.updateDraft({ body: "two", title: "base" });
  controller.updateDraft({ body: "three", title: "base" });
  void controller.saveNow();
  expect(calls).toHaveLength(1);
  resolvers.shift()?.({ savedAt: "2026-01-02T00:00:00.000Z", savedRevision: 8, status: "saved" });
  await Promise.resolve();
  expect(calls).toHaveLength(2);
  expect(calls[1]?.content.body).toBe("three");
  expect(calls[1]?.expectedRevision).toBe(8);
  resolvers.shift()?.({ savedAt: "2026-01-03T00:00:00.000Z", savedRevision: 9, status: "saved" });
  await saving;
  expect(maxActive).toBe(1);
  expect(controller.getState()).toMatchObject({
    isDirty: false,
    savedRevision: 9,
    status: "clean",
  });
});

test("a save confirms only its submitted snapshot and leaves newer local work dirty", async () => {
  let resolveSave:
    | ((value: { savedAt: string; savedRevision: number; status: "saved" }) => void)
    | undefined;
  const { controller } = createController({
    autoSaveEnabled: false,
    persist: () =>
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
  });
  controller.updateDraft({ body: "submitted", title: "base" });
  const saving = controller.saveNow();
  controller.updateDraft({ body: "newer", title: "base" });
  resolveSave?.({ savedAt: "2026-01-02T00:00:00.000Z", savedRevision: 8, status: "saved" });
  await saving;
  expect(controller.getState()).toMatchObject({ isDirty: true, savedRevision: 8, status: "dirty" });
});

test("conflicts never retry a stale revision and reconciled save adopts the fresh revision", async () => {
  const calls: Array<{ expectedRevision: number }> = [];
  const { controller } = createController({
    autoSaveEnabled: false,
    persist: async (request) => {
      calls.push(request);
      return calls.length === 1
        ? { serverRevision: 8, status: "conflict" as const }
        : { savedAt: "2026-01-03T00:00:00.000Z", savedRevision: 9, status: "saved" as const };
    },
  });
  controller.updateDraft({ body: "local", title: "base" });
  await controller.saveNow();
  await controller.saveNow();
  expect(calls.map((call) => call.expectedRevision)).toEqual([7]);
  controller.prepareReconciledDraft(
    { body: "server", title: "base" },
    { body: "local", title: "server-title" },
    8,
    "2026-01-02T00:00:00.000Z",
  );
  await controller.saveReconciled("conflict-merge");
  expect(calls.map((call) => call.expectedRevision)).toEqual([7, 8]);
  expect(controller.getState()).toMatchObject({
    isDirty: false,
    savedRevision: 9,
    status: "clean",
  });
});

test("failures always leave saving state and automatic retries are bounded", async () => {
  const { calls, controller } = createController({
    persist: async (request) => {
      calls.push(request);
      return { error: "temporary", retryable: true, status: "failed" as const };
    },
  });
  controller.updateDraft({ body: "local", title: "base" });
  await controller.saveNow();
  expect(controller.getState()).toMatchObject({ isDirty: true, status: "failed" });

  const autoCalls: unknown[] = [];
  const auto = createController({
    persist: async (request) => {
      autoCalls.push(request);
      return { error: "temporary", retryable: true, status: "failed" as const };
    },
  });
  auto.controller.updateDraft({ body: "local", title: "base" });
  (auto.scheduler as ManualScheduler).runAll();
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(auto.controller.getState().status).toBe("failed");
  expect(autoCalls).toHaveLength(4);
});

test("three-way merge preserves non-overlapping server changes and rejects overlaps, arrays, and unsafe keys", () => {
  const nonOverlapping = mergeEventWebsiteDraftThreeWay({
    base: { body: "base", title: "base" },
    local: { body: "local", title: "base" },
    server: { body: "base", title: "server" },
  });
  expect(nonOverlapping.overlappingPaths).toEqual([]);
  expect(nonOverlapping.merged).toEqual({ body: "local", title: "server" });

  const overlapping = mergeEventWebsiteDraftThreeWay({
    base: { body: "base", title: "base", tags: ["a"] },
    local: { body: "local", title: "base", tags: ["local"] },
    server: { body: "server", title: "base", tags: ["server"] },
  });
  expect(overlapping.overlappingPaths).toContainEqual(["body"]);
  expect(overlapping.overlappingPaths).toContainEqual(["tags"]);
  expect(
    mergeEventWebsiteDraftThreeWay({ base: "base", local: "local", server: "server" }).merged,
  ).toBe("local");
  expect(() => assertSafeEventWebsiteDraftMergeValue(JSON.parse('{"__proto__":{"x":1}}'))).toThrow(
    "Unsafe draft merge key",
  );
});

test("navigation and publish remain separate from draft persistence", () => {
  const autosaveSource = readFileSync(
    join(process.cwd(), "src/components/dashboard/event/use-event-website-autosave.ts"),
    "utf8",
  );
  expect(autosaveSource.match(/addEventListener\("beforeunload"/g) ?? []).toHaveLength(1);
  expect(autosaveSource.match(/removeEventListener\("beforeunload"/g) ?? []).toHaveLength(1);
  const saveActionSource = readFileSync(
    join(process.cwd(), "src/server/actions/event-website.ts"),
    "utf8",
  );
  expect(saveActionSource).not.toContain("publishEventWebsite");
});

test("default timer scheduler schedules and clears without a receiver error", async () => {
  const calls: string[] = [];
  const controller = new DraftSaveController<TestDraft>({
    autoSaveEnabled: true,
    debounceMs: 1,
    initialContent: { body: "base", title: "base" },
    initialSavedAt: null,
    initialSavedRevision: 1,
    persist: async (request) => {
      calls.push(request.reason);
      return { savedAt: "2026-01-01T00:00:00.000Z", savedRevision: 2, status: "saved" };
    },
  });
  expect(() => controller.updateDraft({ body: "changed", title: "base" })).not.toThrow();
  controller.setAutoSaveEnabled(false);
  await new Promise((resolve) => setTimeout(resolve, 5));
  expect(calls).toEqual([]);
  controller.setAutoSaveEnabled(true);
  controller.updateDraft({ body: "changed again", title: "base" });
  await new Promise((resolve) => setTimeout(resolve, 5));
  expect(calls).toEqual(["auto"]);
  controller.dispose();
});

test("each save carries a request-scoped mutation identity while retaining revision locking", async () => {
  const { calls, controller } = createController({ autoSaveEnabled: false });
  controller.updateDraft({ body: "changed", title: "base" });
  await controller.saveNow();
  expect(calls[0]?.mutationId).toMatch(/^[0-9a-f-]{20,}$/i);
  expect(calls[0]?.expectedRevision).toBe(7);
});

test("Publish latest does not use a page-loaded expected saved revision", () => {
  const source = readFileSync(
    join(process.cwd(), "src/components/dashboard/website-access/use-website-access-demo-state.ts"),
    "utf8",
  );
  expect(source).toContain("revisionCoordinator.waitForSave(eventId)");
  expect(source).not.toContain("expectedSavedRevision: serverState.savedRevision");
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
