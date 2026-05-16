import { buildDefaultWeddingEventWebsiteContent } from "@/lib/event-website/defaults";
import type { EventWebsiteContent, EventWebsiteDefaultsContext } from "@/lib/event-website/types";
import {
  EventWebsiteContentPatchSchema,
  EventWebsiteContentSchema,
  type EventWebsiteContentPatchInput,
} from "@/lib/validations/event-website.schema";

export function parseEventWebsiteContentJson(raw: unknown): EventWebsiteContent | null {
  const parsed = EventWebsiteContentSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function mergeEventWebsiteContent(
  savedContent: unknown,
  context: EventWebsiteDefaultsContext = {},
): EventWebsiteContent {
  const defaults = buildDefaultWeddingEventWebsiteContent(context);
  const parsedPatch = EventWebsiteContentPatchSchema.safeParse(savedContent);

  if (!parsedPatch.success) {
    return defaults;
  }

  return EventWebsiteContentSchema.parse(mergeEventWebsiteContentPatch(defaults, parsedPatch.data));
}

export function normalizeEventWebsiteContentForSave(draft: unknown): EventWebsiteContent {
  const parsedPatch = EventWebsiteContentPatchSchema.parse(draft);
  const defaults = buildDefaultWeddingEventWebsiteContent();

  return EventWebsiteContentSchema.parse(mergeEventWebsiteContentPatch(defaults, parsedPatch));
}

function mergeEventWebsiteContentPatch(
  defaults: EventWebsiteContent,
  patch: EventWebsiteContentPatchInput,
): EventWebsiteContent {
  return {
    assets: patch.assets ?? defaults.assets,
    eventType: patch.eventType ?? defaults.eventType,
    layout: {
      enabledSections: {
        ...defaults.layout.enabledSections,
        ...(patch.layout?.enabledSections ?? {}),
      },
      sectionOrder: patch.layout?.sectionOrder
        ? [...patch.layout.sectionOrder]
        : [...defaults.layout.sectionOrder],
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
      gift_details: {
        ...defaults.sections.gift_details,
        ...(patch.sections?.gift_details ?? {}),
      },
      guestbook: {
        ...defaults.sections.guestbook,
        ...(patch.sections?.guestbook ?? {}),
      },
      host_info: {
        ...defaults.sections.host_info,
        ...(patch.sections?.host_info ?? {}),
      },
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
        ...defaults.sections.rsvp_form,
        ...(patch.sections?.rsvp_form ?? {}),
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
    },
    version: patch.version ?? defaults.version,
  };
}
