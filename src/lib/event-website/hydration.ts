import {
  buildDefaultEventWebsiteContent,
  getDisallowedSectionsForEventType,
  resolveEventWebsiteSectionOrder,
} from "@/lib/event-website/defaults";
import {
  formatCanonicalRsvpCloseAtToEditorInput,
  normalizeCanonicalDateInput,
  normalizeCanonicalText,
  normalizeCanonicalTimeInput,
} from "@/lib/event-website/canonical";
import { eventWebsiteContentSectionKeys } from "@/lib/event-website/types";
import type {
  EventWebsiteContent,
  EventWebsiteContentSectionKey,
  EventWebsiteDefaultsContext,
  EventWebsiteHostInfoSection,
  EventWebsiteRsvpFormSection,
} from "@/lib/event-website/types";
import {
  EventWebsiteContentPatchSchema,
  EventWebsiteContentSchema,
  type EventWebsiteContentPatchInput,
} from "@/lib/validations/event-website.schema";

type EventWebsiteHostInfoPatch = NonNullable<
  NonNullable<EventWebsiteContentPatchInput["sections"]>["host_info"]
>;

export function parseEventWebsiteContentJson(raw: unknown): EventWebsiteContent | null {
  const parsed = validateEventWebsiteContentJson(raw);
  return parsed.success ? normalizeParsedEventWebsiteContent(parsed.data) : null;
}

export function isEmptyJsonObject(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value as Record<string, unknown>).length === 0
  );
}

export function validateEventWebsiteContentJson(raw: unknown) {
  return EventWebsiteContentSchema.safeParse(upgradeLegacyEventWebsiteContent(raw));
}

export function validateEventWebsiteContentForPersistence(raw: unknown): EventWebsiteContent {
  return EventWebsiteContentSchema.parse(raw);
}

export function getEventWebsiteContentIssuePaths(raw: unknown) {
  const parsed = validateEventWebsiteContentJson(raw);

  if (parsed.success) {
    return [];
  }

  return parsed.error.issues.map((issue) => formatEventWebsiteIssuePath(issue.path));
}

function formatEventWebsiteIssuePath(path: PropertyKey[]) {
  return path.length > 0 ? path.map(String).join(".") : "root";
}

export function mergeEventWebsiteContent(
  savedContent: unknown,
  context: EventWebsiteDefaultsContext = {},
): EventWebsiteContent {
  const defaults = buildDefaultEventWebsiteContent(context.event?.eventType, context);
  const parsedPatch = EventWebsiteContentPatchSchema.safeParse(
    upgradeLegacyEventWebsiteContent(savedContent),
  );

  if (!parsedPatch.success) {
    return applyCanonicalEventFieldOverrides(defaults, context);
  }

  const merged = EventWebsiteContentSchema.parse(
    mergeEventWebsiteContentPatch(defaults, parsedPatch.data),
  );

  return applyCanonicalEventFieldOverrides(merged, context);
}

export function normalizeEventWebsiteContentForSave(draft: unknown): EventWebsiteContent {
  const parsedPatch = EventWebsiteContentPatchSchema.parse(draft);
  const eventType =
    isRecord(draft) && typeof draft.eventType === "string" ? draft.eventType : "wedding";
  const defaults = buildDefaultEventWebsiteContent(eventType);

  return EventWebsiteContentSchema.parse(mergeEventWebsiteContentPatch(defaults, parsedPatch));
}

function upgradeLegacyEventWebsiteContent(raw: unknown): unknown {
  if (!isRecord(raw)) {
    return raw;
  }

  const layout = raw.layout;
  const sections = raw.sections;

  if (!isRecord(layout) || !isRecord(sections)) {
    return raw;
  }

  const rawEventType = typeof raw.eventType === "string" ? raw.eventType : "wedding";
  const defaults = buildDefaultEventWebsiteContent(rawEventType);

  const hostInfo = isRecord(sections.host_info) ? sections.host_info : null;
  const normalizedHostInfo =
    hostInfo && typeof hostInfo.kind !== "string"
      ? { kind: rawEventType, ...hostInfo }
      : (hostInfo ?? defaults.sections.host_info);

  const rawEnabledSections = isRecord(layout.enabledSections) ? layout.enabledSections : {};
  const rawSectionOrder = Array.isArray(layout.sectionOrder) ? layout.sectionOrder : [];

  const enabledSections: Record<string, boolean> = {};
  for (const key of eventWebsiteContentSectionKeys) {
    if (typeof rawEnabledSections[key] === "boolean") {
      enabledSections[key] = rawEnabledSections[key] as boolean;
    } else {
      enabledSections[key] = defaults.layout.enabledSections[key] ?? false;
    }
  }

  const disallowedLegacyKeys = getDisallowedSectionsForEventType(rawEventType);
  for (const key of disallowedLegacyKeys) {
    enabledSections[key] = false;
  }

  const sectionOrder = resolveEventWebsiteSectionOrder({
    eventType: rawEventType,
    storedSectionOrder: rawSectionOrder,
  });

  const normalizedSections: Record<string, unknown> = {
    ...sections,
    host_info: normalizedHostInfo,
  };

  for (const key of eventWebsiteContentSectionKeys) {
    if (!isRecord(normalizedSections[key])) {
      normalizedSections[key] = { ...defaults.sections[key] };
    }
  }

  return {
    ...raw,
    layout: {
      ...layout,
      enabledSections,
      sectionOrder,
    },
    sections: normalizedSections,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function mergeEventWebsiteContentPatch(
  defaults: EventWebsiteContent,
  patch: EventWebsiteContentPatchInput,
): EventWebsiteContent {
  const resolvedEventType = patch.eventType ?? defaults.eventType;
  const sectionOrder = resolveEventWebsiteSectionOrder({
    eventType: resolvedEventType,
    storedSectionOrder: patch.layout?.sectionOrder,
  });

  const mergedEnabledSections: Record<string, boolean> = {
    ...defaults.layout.enabledSections,
    ...(patch.layout?.enabledSections ?? {}),
  };
  const disallowedPatchKeys = getDisallowedSectionsForEventType(resolvedEventType);
  for (const key of disallowedPatchKeys) {
    mergedEnabledSections[key] = false;
  }

  return {
    assets: patch.assets ?? defaults.assets,
    eventType: resolvedEventType,
    layout: {
      enabledSections: mergedEnabledSections,
      sectionOrder,
    },
    meta: {
      savedAt: patch.meta?.savedAt ?? defaults.meta.savedAt,
      savedBy: patch.meta?.savedBy ?? defaults.meta.savedBy,
    },
    sections: {
      attire_motif: {
        ...defaults.sections.attire_motif,
        ...(patch.sections?.attire_motif ?? {}),
      },
      contact_socials: {
        ...defaults.sections.contact_socials,
        ...(patch.sections?.contact_socials ?? {}),
      },
      countdown: {
        ...defaults.sections.countdown,
        ...(patch.sections?.countdown ?? {}),
      },
      extra_info: {
        ...defaults.sections.extra_info,
        ...(patch.sections?.extra_info ?? {}),
      },
      gallery: {
        ...defaults.sections.gallery,
        ...(patch.sections?.gallery ?? {}),
      },
      gift_details: {
        ...defaults.sections.gift_details,
        ...(patch.sections?.gift_details ?? {}),
      },
      guestbook: {
        ...defaults.sections.guestbook,
        ...(patch.sections?.guestbook ?? {}),
      },
      host_info: mergeHostInfoSection(defaults.sections.host_info, patch.sections?.host_info),
      main_event: {
        ...defaults.sections.main_event,
        ...(patch.sections?.main_event ?? {}),
      },
      music_effects: {
        ...defaults.sections.music_effects,
        ...(patch.sections?.music_effects ?? {}),
      },
      principal_sponsors: {
        ...defaults.sections.principal_sponsors,
        ...(patch.sections?.principal_sponsors ?? {}),
      },
      rsvp_form: {
        ...normalizeRsvpFormSection({
          ...defaults.sections.rsvp_form,
          ...(patch.sections?.rsvp_form ?? {}),
        }),
      },
      secondary_event: {
        ...defaults.sections.secondary_event,
        ...(patch.sections?.secondary_event ?? {}),
      },
      story_message: {
        ...defaults.sections.story_message,
        ...(patch.sections?.story_message ?? {}),
      },
      timeline_program: {
        ...defaults.sections.timeline_program,
        ...(patch.sections?.timeline_program ?? {}),
      },
      entourage: {
        ...defaults.sections.entourage,
        ...(patch.sections?.entourage ?? {}),
      },
      venue: {
        ...defaults.sections.venue,
        ...(patch.sections?.venue ?? {}),
      },
      eighteen_roses_candles: {
        ...defaults.sections.eighteen_roses_candles,
        ...(patch.sections?.eighteen_roses_candles ?? {}),
      },
      debut_court: { ...defaults.sections.debut_court, ...(patch.sections?.debut_court ?? {}) },
      godparents: { ...defaults.sections.godparents, ...(patch.sections?.godparents ?? {}) },
    },
    version: patch.version ?? defaults.version,
  };
}

function mergeHostInfoSection(
  defaults: EventWebsiteHostInfoSection,
  patch: EventWebsiteHostInfoPatch | undefined,
): EventWebsiteHostInfoSection {
  if (!patch || (patch.kind && patch.kind !== defaults.kind)) {
    return defaults;
  }

  return { ...defaults, ...patch, kind: defaults.kind } as EventWebsiteHostInfoSection;
}

function normalizeRsvpFormSection(
  settings: EventWebsiteRsvpFormSection,
): EventWebsiteRsvpFormSection {
  const emailEnabled = settings.emailEnabled;
  const phoneEnabled = settings.phoneEnabled;

  return {
    ...settings,
    emailEnabled,
    emailRequired: emailEnabled ? settings.emailRequired : false,
    messageToHostEnabled: true,
    phoneEnabled,
    phoneRequired: phoneEnabled ? settings.phoneRequired : false,
  };
}

function normalizeParsedEventWebsiteContent(content: EventWebsiteContent): EventWebsiteContent {
  return {
    ...content,
    sections: {
      ...content.sections,
      rsvp_form: normalizeRsvpFormSection(content.sections.rsvp_form),
    },
  };
}

function applyCanonicalEventFieldOverrides(
  content: EventWebsiteContent,
  context: EventWebsiteDefaultsContext,
) {
  const eventDate = normalizeCanonicalDateInput(context.event?.eventDate);
  const eventTime = normalizeCanonicalTimeInput(context.event?.eventTime);
  const rsvpCloseAt = formatCanonicalRsvpCloseAtToEditorInput(context.event?.rsvpCloseAt);
  const venueName = normalizeCanonicalText(context.event?.venueName);
  const venueAddress = normalizeCanonicalText(context.event?.venueAddress);

  if (!eventDate && !eventTime && !rsvpCloseAt && !venueName && !venueAddress) {
    return content;
  }

  return {
    ...content,
    sections: {
      ...content.sections,
      main_event: {
        ...content.sections.main_event,
        ...(eventDate ? { eventDate } : {}),
        ...(eventTime ? { eventTime } : {}),
        ...(rsvpCloseAt ? { rsvpDeadline: rsvpCloseAt } : {}),
      },
      venue: {
        ...content.sections.venue,
        ...(venueAddress ? { address: venueAddress } : {}),
        ...(venueName ? { venueName } : {}),
      },
    },
  };
}
