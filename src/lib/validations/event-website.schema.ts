import { z } from "zod";
import { buildManilaOffsetDateTime } from "@/lib/event-website/canonical";
import {
  DEFAULT_EVENT_WEBSITE_GUESTBOOK_EMPTY_STATE,
  DEFAULT_EVENT_WEBSITE_GUESTBOOK_INTRO,
  DEFAULT_EVENT_WEBSITE_GUESTBOOK_TITLE,
  DEFAULT_WEDDING_EVENT_TYPE,
  eventWebsiteContentEventTypes,
  eventWebsiteContentSectionKeys,
  eventWebsiteCustomQuestionFieldTypes,
  type EventWebsiteContentSectionKey,
} from "@/lib/event-website/types";

const DANGEROUS_PROTOCOLS = new Set(["javascript:", "data:", "file:"]);
const SECTION_COUNT = eventWebsiteContentSectionKeys.length;

function trimString(value: unknown) {
  return typeof value === "string" ? value.trim() : value;
}

function draftText(max: number) {
  return z.preprocess(trimString, z.string().max(max));
}

function requiredDraftText(max: number) {
  return z.preprocess(trimString, z.string().min(1).max(max));
}

function lineDelimitedItemCount(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function isValidDateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTimeInput(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isValidCanonicalTimeInput(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value);
}

function isValidLocalDateTimeInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
}

function normalizeNullableTextInput(value: unknown) {
  const normalized = trimString(value);

  if (normalized === "") {
    return null;
  }

  return normalized;
}

const LEGACY_EVENT_WEBSITE_GUESTBOOK_TITLE = "Guestbook";
const LEGACY_EVENT_WEBSITE_GUESTBOOK_INTRO = "Read warm wishes and messages from our guests.";

function normalizeGuestbookTitle(value: unknown) {
  if (typeof value !== "string") {
    return DEFAULT_EVENT_WEBSITE_GUESTBOOK_TITLE;
  }

  return value === LEGACY_EVENT_WEBSITE_GUESTBOOK_TITLE
    ? DEFAULT_EVENT_WEBSITE_GUESTBOOK_TITLE
    : value;
}

function normalizeGuestbookIntro(value: unknown) {
  if (typeof value !== "string") {
    return DEFAULT_EVENT_WEBSITE_GUESTBOOK_INTRO;
  }

  return value === LEGACY_EVENT_WEBSITE_GUESTBOOK_INTRO
    ? DEFAULT_EVENT_WEBSITE_GUESTBOOK_INTRO
    : value;
}

function normalizeGuestbookSectionInput(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const raw = value as Record<string, unknown>;
  const { messageBody, ...normalized } = raw;

  return {
    ...normalized,
    emptyStateMessage:
      typeof raw.emptyStateMessage === "string"
        ? raw.emptyStateMessage
        : DEFAULT_EVENT_WEBSITE_GUESTBOOK_EMPTY_STATE,
    sectionIntro:
      typeof raw.sectionIntro === "string"
        ? normalizeGuestbookIntro(raw.sectionIntro)
        : typeof messageBody === "string"
          ? normalizeGuestbookIntro(messageBody)
          : DEFAULT_EVENT_WEBSITE_GUESTBOOK_INTRO,
    sectionTitle:
      typeof raw.sectionTitle === "string"
        ? normalizeGuestbookTitle(raw.sectionTitle)
        : DEFAULT_EVENT_WEBSITE_GUESTBOOK_TITLE,
  };
}

function normalizeGuestbookSectionPatchInput(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const raw = value as Record<string, unknown>;
  const { messageBody, ...normalized } = raw;

  if (typeof raw.emptyStateMessage === "string") {
    normalized.emptyStateMessage = raw.emptyStateMessage;
  }

  if (typeof raw.sectionIntro === "string") {
    normalized.sectionIntro = normalizeGuestbookIntro(raw.sectionIntro);
  } else if (typeof messageBody === "string") {
    normalized.sectionIntro = normalizeGuestbookIntro(messageBody);
  }

  if (typeof raw.sectionTitle === "string") {
    normalized.sectionTitle = normalizeGuestbookTitle(raw.sectionTitle);
  }

  return normalized;
}

export function isSafeHttpUrl(value: string) {
  if (!value) {
    return true;
  }

  const lowered = value.toLowerCase();

  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (lowered.startsWith(protocol)) {
      return false;
    }
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const EventWebsiteContentSectionKeySchema = z.enum(eventWebsiteContentSectionKeys);
export const EventWebsiteContentEventTypeSchema = z.enum(eventWebsiteContentEventTypes);
export const EventWebsiteCustomQuestionFieldTypeSchema = z.enum(
  eventWebsiteCustomQuestionFieldTypes,
);

export const EventWebsiteItemIdSchema = z.preprocess(trimString, z.string().min(1).max(100));

export const EventWebsiteSafeUrlSchema = (max: number) =>
  draftText(max).refine((value) => isSafeHttpUrl(value), {
    error: "Use a valid http or https URL.",
  });

export const EventWebsiteDateInputSchema = draftText(10).refine(
  (value) => value === "" || isValidDateInput(value),
  {
    error: "Use YYYY-MM-DD format.",
  },
);

export const EventWebsiteTimeInputSchema = draftText(5).refine(
  (value) => value === "" || isValidTimeInput(value),
  {
    error: "Use HH:MM format.",
  },
);

export const EventWebsiteLocalDateTimeInputSchema = draftText(16).refine(
  (value) => value === "" || isValidLocalDateTimeInput(value),
  {
    error: "Use YYYY-MM-DDTHH:MM format.",
  },
);

export const EventWebsiteImageAssetSchema = z
  .object({
    alt: draftText(160).optional(),
    path: requiredDraftText(500),
    url: EventWebsiteSafeUrlSchema(2000).optional(),
  })
  .strict();

export const EventWebsiteWeddingHostInfoSectionSchema = z
  .object({
    kind: z.literal("wedding"),
    brideName: draftText(40),
    displayAs: draftText(80),
    groomName: draftText(40),
    hostLine: draftText(120),
    shortHostMessage: draftText(160),
  })
  .strict();

export const EventWebsiteBirthdayHostInfoSectionSchema = z
  .object({
    kind: z.literal("birthday"),
    celebrantName: draftText(60),
    milestone: draftText(40),
    displayAs: draftText(80),
    hostLine: draftText(120),
    shortHostMessage: draftText(160),
  })
  .strict();
export const EventWebsiteDebutHostInfoSectionSchema = z
  .object({
    kind: z.literal("debut"),
    debutantName: draftText(60),
    milestone: draftText(40),
    displayAs: draftText(80),
    hostLine: draftText(120),
    shortHostMessage: draftText(160),
  })
  .strict();
export const EventWebsiteBaptismHostInfoSectionSchema = z
  .object({
    kind: z.literal("baptism"),
    childName: draftText(60),
    parentNames: draftText(120),
    displayAs: draftText(80),
    hostLine: draftText(120),
    shortHostMessage: draftText(160),
  })
  .strict();
export const EventWebsiteHostInfoSectionSchema = z.discriminatedUnion("kind", [
  EventWebsiteWeddingHostInfoSectionSchema,
  EventWebsiteBirthdayHostInfoSectionSchema,
  EventWebsiteDebutHostInfoSectionSchema,
  EventWebsiteBaptismHostInfoSectionSchema,
]);

const EventWebsiteNamedEntrySchema = z
  .object({ id: EventWebsiteItemIdSchema, name: draftText(120) })
  .strict();
export const EventWebsiteEighteenRosesCandlesSectionSchema = z
  .object({
    groups: z
      .array(
        z
          .object({
            id: EventWebsiteItemIdSchema,
            title: draftText(80),
            kind: z.enum(["roses", "candles", "treasures", "custom"]),
            entries: z
              .array(EventWebsiteNamedEntrySchema.extend({ message: draftText(220) }))
              .max(18),
          })
          .strict(),
      )
      .max(8),
  })
  .strict();
export const EventWebsiteNamedGroupsSectionSchema = z
  .object({
    groups: z
      .array(
        z
          .object({
            id: EventWebsiteItemIdSchema,
            title: draftText(80),
            names: z.array(EventWebsiteNamedEntrySchema).max(40),
          })
          .strict(),
      )
      .max(12),
  })
  .strict();

export const EventWebsiteCountdownSectionSchema = z
  .object({
    shortNote: draftText(160),
    title: draftText(90),
  })
  .strict();

export const EventWebsiteMusicEffectsSectionSchema = z
  .object({
    musicLink: EventWebsiteSafeUrlSchema(240),
    musicTitle: draftText(80),
    playButtonLabel: draftText(80),
    shortNote: draftText(180),
  })
  .strict();

export const EventWebsiteMainEventSectionSchema = z
  .object({
    endTime: EventWebsiteTimeInputSchema,
    eventDate: EventWebsiteDateInputSchema,
    eventLabel: draftText(80),
    eventTime: EventWebsiteTimeInputSchema,
    rsvpDeadline: EventWebsiteLocalDateTimeInputSchema,
    scheduleNote: draftText(200),
  })
  .strict();

export const EventWebsiteVenueSectionSchema = z
  .object({
    address: draftText(180),
    arrivalNote: draftText(160),
    mapsLink: EventWebsiteSafeUrlSchema(200),
    venueName: draftText(80),
  })
  .strict();

export const EventWebsiteSecondaryEventSectionSchema = z
  .object({
    address: draftText(180),
    endTime: EventWebsiteTimeInputSchema,
    mapsLink: EventWebsiteSafeUrlSchema(200),
    note: draftText(180),
    startTime: EventWebsiteTimeInputSchema,
    title: draftText(80),
    venueName: draftText(80),
  })
  .strict();

export const EventWebsiteTimelineItemSchema = z
  .object({
    description: draftText(180),
    id: EventWebsiteItemIdSchema,
    time: EventWebsiteTimeInputSchema,
    title: draftText(80),
  })
  .strict();

export const EventWebsiteTimelineProgramSectionSchema = z
  .object({
    items: z.array(EventWebsiteTimelineItemSchema).max(20),
  })
  .strict();

export const EventWebsiteEntourageGroupSchema = z
  .object({
    groupTitle: draftText(80),
    id: EventWebsiteItemIdSchema,
    names: draftText(220),
  })
  .strict();

export const EventWebsiteEntourageSectionSchema = z
  .object({
    groups: z.array(EventWebsiteEntourageGroupSchema).max(20),
    introLine: draftText(220),
  })
  .strict();

export const EventWebsitePrincipalSponsorsSectionSchema = z
  .object({
    introLine: draftText(220),
    names: draftText(1200).superRefine((value, ctx) => {
      if (lineDelimitedItemCount(value) > 40) {
        ctx.addIssue({
          code: "custom",
          message: "Use at most 40 principal sponsor names.",
        });
      }
    }),
  })
  .strict();

export const EventWebsiteAttireMotifSectionSchema = z
  .object({
    colorMotifNote: draftText(180),
    dressCodeNote: draftText(180),
    sectionIntro: draftText(180),
  })
  .strict();

export const EventWebsiteExtraInfoItemSchema = z
  .object({
    details: draftText(220),
    id: EventWebsiteItemIdSchema,
    title: draftText(80),
  })
  .strict();

export const EventWebsiteExtraInfoSectionSchema = z
  .object({
    items: z.array(EventWebsiteExtraInfoItemSchema).max(12),
    sectionIntro: draftText(180),
    sectionTitle: draftText(80),
  })
  .strict();

export const EventWebsiteCustomQuestionSchema = z
  .object({
    fieldType: EventWebsiteCustomQuestionFieldTypeSchema,
    id: EventWebsiteItemIdSchema,
    label: draftText(100),
    options: z.array(draftText(80)).max(12),
    required: z.boolean(),
  })
  .strict();

export const EventWebsiteRsvpFormSectionSchema = z
  .object({
    companionAgeEnabled: z.boolean(),
    companionLimit: z.number().int().min(0).max(10),
    companionNameEnabled: z.boolean(),
    customQuestions: z.array(EventWebsiteCustomQuestionSchema).max(10),
    emailEnabled: z.boolean().optional().default(true),
    emailRequired: z.boolean().optional().default(true),
    foodAllergiesEnabled: z.boolean(),
    messageToHostEnabled: z.boolean().optional().default(true),
    phoneEnabled: z.boolean().optional().default(false),
    phoneRequired: z.boolean().optional().default(false),
    plusOneEnabled: z.boolean(),
  })
  .strict();

export const EventWebsiteGiftOptionSchema = z
  .object({
    id: EventWebsiteItemIdSchema,
    image: EventWebsiteImageAssetSchema.nullable(),
    title: draftText(80),
  })
  .strict();

export const EventWebsiteGiftDetailsSectionSchema = z
  .object({
    giftNote: draftText(360),
    options: z.array(EventWebsiteGiftOptionSchema).max(2),
    sectionIntro: draftText(200),
  })
  .strict();

export const EventWebsiteGuestbookSectionSchema = z.preprocess(
  normalizeGuestbookSectionInput,
  z
    .object({
      emptyStateMessage: draftText(320),
      sectionIntro: draftText(320),
      sectionTitle: draftText(80),
    })
    .strict(),
);

export const EventWebsiteStoryMessageSectionSchema = z
  .object({
    sectionIntro: draftText(180),
    storyBody: draftText(420),
    storyTitle: draftText(80),
  })
  .strict();

const emailDraftSchema = draftText(120).refine(
  (value) => {
    if (!value) {
      return true;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },
  {
    error: "Enter a valid email address.",
  },
);

export const EventWebsiteContactSocialsSectionSchema = z
  .object({
    contactNumber: draftText(40),
    contactPerson: draftText(80),
    email: emailDraftSchema,
    facebookUrl: EventWebsiteSafeUrlSchema(200),
    instagramUrl: EventWebsiteSafeUrlSchema(200),
    tikTokUrl: EventWebsiteSafeUrlSchema(200),
  })
  .strict();

export const EventWebsiteGallerySectionSchema = z
  .object({
    sectionIntro: draftText(500),
    sectionTitle: draftText(120),
  })
  .strict();

export const EventWebsiteSectionsSchema = z
  .object({
    attire_motif: EventWebsiteAttireMotifSectionSchema,
    contact_socials: EventWebsiteContactSocialsSectionSchema,
    countdown: EventWebsiteCountdownSectionSchema,
    extra_info: EventWebsiteExtraInfoSectionSchema,
    gallery: EventWebsiteGallerySectionSchema,
    gift_details: EventWebsiteGiftDetailsSectionSchema,
    guestbook: EventWebsiteGuestbookSectionSchema,
    host_info: EventWebsiteHostInfoSectionSchema,
    main_event: EventWebsiteMainEventSectionSchema,
    music_effects: EventWebsiteMusicEffectsSectionSchema,
    principal_sponsors: EventWebsitePrincipalSponsorsSectionSchema,
    rsvp_form: EventWebsiteRsvpFormSectionSchema,
    secondary_event: EventWebsiteSecondaryEventSectionSchema,
    story_message: EventWebsiteStoryMessageSectionSchema,
    timeline_program: EventWebsiteTimelineProgramSectionSchema,
    entourage: EventWebsiteEntourageSectionSchema,
    venue: EventWebsiteVenueSectionSchema,
    eighteen_roses_candles: EventWebsiteEighteenRosesCandlesSectionSchema,
    debut_court: EventWebsiteNamedGroupsSectionSchema,
    godparents: EventWebsiteNamedGroupsSectionSchema,
  })
  .strict();

const enabledSectionsShape = Object.fromEntries(
  eventWebsiteContentSectionKeys.map((key) => [key, z.boolean()]),
) as Record<EventWebsiteContentSectionKey, z.ZodBoolean>;

const enabledSectionsPatchShape = Object.fromEntries(
  eventWebsiteContentSectionKeys.map((key) => [key, z.boolean().optional()]),
) as Record<EventWebsiteContentSectionKey, z.ZodOptional<z.ZodBoolean>>;

export const EventWebsiteEnabledSectionsSchema = z.object(enabledSectionsShape).strict();

export const EventWebsiteLayoutSchema = z
  .object({
    enabledSections: EventWebsiteEnabledSectionsSchema,
    sectionOrder: z
      .array(EventWebsiteContentSectionKeySchema)
      .length(SECTION_COUNT)
      .superRefine((value, ctx) => {
        if (new Set(value).size !== SECTION_COUNT) {
          ctx.addIssue({
            code: "custom",
            message: "Section order must contain each accepted section exactly once.",
          });
        }
      }),
  })
  .strict();

export const EventWebsiteContentAssetsSchema = z.object({}).strict();

export const EventWebsiteContentMetaSchema = z
  .object({
    savedAt: z
      .union([z.string().datetime({ offset: true }), z.null()])
      .or(z.literal("").transform(() => null)),
    savedBy: z.union([z.uuid(), z.null()]).or(z.literal("").transform(() => null)),
  })
  .strict();

export const EventWebsiteCanonicalEventPatchSchema = z
  .object({
    event_date: z.preprocess(
      normalizeNullableTextInput,
      z.union([
        z.string().refine(isValidDateInput, {
          error: "Use YYYY-MM-DD format.",
        }),
        z.null(),
      ]),
    ),
    event_time: z.preprocess(
      normalizeNullableTextInput,
      z.union([
        z.string().refine(isValidCanonicalTimeInput, {
          error: "Use HH:MM or HH:MM:SS format.",
        }),
        z.null(),
      ]),
    ),
    rsvp_close_at: z.preprocess(
      normalizeNullableTextInput,
      z.union([z.string().datetime({ offset: true }), z.null()]),
    ),
    venue_address: z.preprocess(
      normalizeNullableTextInput,
      z.union([z.string().max(180), z.null()]),
    ),
    venue_name: z.preprocess(normalizeNullableTextInput, z.union([z.string().max(80), z.null()])),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.event_date || !value.event_time || !value.rsvp_close_at) {
      return;
    }

    const ceremonyDateTime = buildManilaOffsetDateTime(value.event_date, value.event_time);

    if (!ceremonyDateTime) {
      return;
    }

    const rsvpDeadline = new Date(value.rsvp_close_at).getTime();
    const ceremonyStart = new Date(ceremonyDateTime).getTime();

    if (Number.isNaN(rsvpDeadline) || Number.isNaN(ceremonyStart)) {
      return;
    }

    if (rsvpDeadline > ceremonyStart) {
      ctx.addIssue({
        code: "custom",
        message: "RSVP deadline must be on or before the ceremony start.",
        path: ["rsvp_close_at"],
      });
    }
  });

export const EventWebsiteContentSchema = z
  .object({
    assets: EventWebsiteContentAssetsSchema,
    eventType: EventWebsiteContentEventTypeSchema,
    layout: EventWebsiteLayoutSchema,
    meta: EventWebsiteContentMetaSchema,
    sections: EventWebsiteSectionsSchema,
    version: z.literal(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.eventType !== value.sections.host_info.kind) {
      ctx.addIssue({
        code: "custom",
        message: "Host info must match the event type.",
        path: ["sections", "host_info", "kind"],
      });
    }
  });

export const EventWebsiteHostInfoSectionPatchSchema = z.union([
  EventWebsiteWeddingHostInfoSectionSchema.partial()
    .extend({ kind: z.literal("wedding").optional() })
    .strict(),
  EventWebsiteBirthdayHostInfoSectionSchema.partial()
    .extend({ kind: z.literal("birthday").optional() })
    .strict(),
  EventWebsiteDebutHostInfoSectionSchema.partial()
    .extend({ kind: z.literal("debut").optional() })
    .strict(),
  EventWebsiteBaptismHostInfoSectionSchema.partial()
    .extend({ kind: z.literal("baptism").optional() })
    .strict(),
]);
export const EventWebsiteCountdownSectionPatchSchema =
  EventWebsiteCountdownSectionSchema.partial().strict();
export const EventWebsiteMusicEffectsSectionPatchSchema =
  EventWebsiteMusicEffectsSectionSchema.partial().strict();
export const EventWebsiteMainEventSectionPatchSchema =
  EventWebsiteMainEventSectionSchema.partial().strict();
export const EventWebsiteVenueSectionPatchSchema =
  EventWebsiteVenueSectionSchema.partial().strict();
export const EventWebsiteSecondaryEventSectionPatchSchema =
  EventWebsiteSecondaryEventSectionSchema.partial().strict();
export const EventWebsiteTimelineProgramSectionPatchSchema = z
  .object({
    items: z.array(EventWebsiteTimelineItemSchema).max(20).optional(),
  })
  .strict();
export const EventWebsiteEntourageSectionPatchSchema = z
  .object({
    groups: z.array(EventWebsiteEntourageGroupSchema).max(20).optional(),
    introLine: draftText(220).optional(),
  })
  .strict();
export const EventWebsitePrincipalSponsorsSectionPatchSchema = z
  .object({
    introLine: draftText(220).optional(),
    names: EventWebsitePrincipalSponsorsSectionSchema.shape.names.optional(),
  })
  .strict();
export const EventWebsiteAttireMotifSectionPatchSchema =
  EventWebsiteAttireMotifSectionSchema.partial().strict();
export const EventWebsiteExtraInfoSectionPatchSchema = z
  .object({
    items: z.array(EventWebsiteExtraInfoItemSchema).max(12).optional(),
    sectionIntro: draftText(180).optional(),
    sectionTitle: draftText(80).optional(),
  })
  .strict();
export const EventWebsiteRsvpFormSectionPatchSchema = z
  .object({
    companionAgeEnabled: z.boolean().optional(),
    companionLimit: z.number().int().min(0).max(10).optional(),
    companionNameEnabled: z.boolean().optional(),
    customQuestions: z.array(EventWebsiteCustomQuestionSchema).max(10).optional(),
    emailEnabled: z.boolean().optional(),
    emailRequired: z.boolean().optional(),
    foodAllergiesEnabled: z.boolean().optional(),
    messageToHostEnabled: z.boolean().optional(),
    phoneEnabled: z.boolean().optional(),
    phoneRequired: z.boolean().optional(),
    plusOneEnabled: z.boolean().optional(),
  })
  .strict();
export const EventWebsiteGiftDetailsSectionPatchSchema = z
  .object({
    giftNote: draftText(360).optional(),
    options: z.array(EventWebsiteGiftOptionSchema).max(2).optional(),
    sectionIntro: draftText(200).optional(),
  })
  .strict();
export const EventWebsiteGuestbookSectionPatchSchema = z.preprocess(
  normalizeGuestbookSectionPatchInput,
  z
    .object({
      emptyStateMessage: draftText(320).optional(),
      sectionIntro: draftText(320).optional(),
      sectionTitle: draftText(80).optional(),
    })
    .strict(),
);
export const EventWebsiteStoryMessageSectionPatchSchema =
  EventWebsiteStoryMessageSectionSchema.partial().strict();
export const EventWebsiteContactSocialsSectionPatchSchema =
  EventWebsiteContactSocialsSectionSchema.partial().strict();

export const EventWebsiteGallerySectionPatchSchema =
  EventWebsiteGallerySectionSchema.partial().strict();

export const EventWebsiteSectionsPatchSchema = z
  .object({
    attire_motif: EventWebsiteAttireMotifSectionPatchSchema.optional(),
    contact_socials: EventWebsiteContactSocialsSectionPatchSchema.optional(),
    countdown: EventWebsiteCountdownSectionPatchSchema.optional(),
    extra_info: EventWebsiteExtraInfoSectionPatchSchema.optional(),
    gallery: EventWebsiteGallerySectionPatchSchema.optional(),
    gift_details: EventWebsiteGiftDetailsSectionPatchSchema.optional(),
    guestbook: EventWebsiteGuestbookSectionPatchSchema.optional(),
    host_info: EventWebsiteHostInfoSectionPatchSchema.optional(),
    main_event: EventWebsiteMainEventSectionPatchSchema.optional(),
    music_effects: EventWebsiteMusicEffectsSectionPatchSchema.optional(),
    principal_sponsors: EventWebsitePrincipalSponsorsSectionPatchSchema.optional(),
    rsvp_form: EventWebsiteRsvpFormSectionPatchSchema.optional(),
    secondary_event: EventWebsiteSecondaryEventSectionPatchSchema.optional(),
    story_message: EventWebsiteStoryMessageSectionPatchSchema.optional(),
    timeline_program: EventWebsiteTimelineProgramSectionPatchSchema.optional(),
    entourage: EventWebsiteEntourageSectionPatchSchema.optional(),
    venue: EventWebsiteVenueSectionPatchSchema.optional(),
    eighteen_roses_candles: EventWebsiteEighteenRosesCandlesSectionSchema.partial().optional(),
    debut_court: EventWebsiteNamedGroupsSectionSchema.partial().optional(),
    godparents: EventWebsiteNamedGroupsSectionSchema.partial().optional(),
  })
  .strict();

export const EventWebsiteLayoutPatchSchema = z
  .object({
    enabledSections: z.object(enabledSectionsPatchShape).strict().optional(),
    sectionOrder: z.array(EventWebsiteContentSectionKeySchema).max(SECTION_COUNT).optional(),
  })
  .strict();

export const EventWebsiteContentPatchSchema = z
  .object({
    assets: EventWebsiteContentAssetsSchema.optional(),
    eventType: EventWebsiteContentEventTypeSchema.optional(),
    layout: EventWebsiteLayoutPatchSchema.optional(),
    meta: EventWebsiteContentMetaSchema.partial().strict().optional(),
    sections: EventWebsiteSectionsPatchSchema.optional(),
    version: z.literal(1).optional(),
  })
  .strict();

export type EventWebsiteContentInput = z.infer<typeof EventWebsiteContentSchema>;
export type EventWebsiteCanonicalEventPatchInput = z.infer<
  typeof EventWebsiteCanonicalEventPatchSchema
>;
export type EventWebsiteContentPatchInput = z.infer<typeof EventWebsiteContentPatchSchema>;
