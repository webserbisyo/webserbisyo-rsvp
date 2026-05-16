import {
  DEFAULT_RSVP_DEADLINE_OFFSET_DAYS,
  DEFAULT_RSVP_DEADLINE_TIME,
  DEFAULT_WEDDING_EVENT_TYPE,
  eventWebsiteContentSectionKeys,
  type EventWebsiteContent,
  type EventWebsiteContentSectionKey,
  type EventWebsiteDefaultsContext,
} from "@/lib/event-website/types";

const DEFAULT_WEDDING_EVENT_DATE = "2026-06-06";
const DEFAULT_WEDDING_EVENT_TIME = "16:00";
const DEFAULT_WEDDING_EVENT_END_TIME = "18:00";

export function getDefaultWeddingSectionOrder(): EventWebsiteContentSectionKey[] {
  return [...eventWebsiteContentSectionKeys];
}

export function getDefaultWeddingEnabledSections(): Record<EventWebsiteContentSectionKey, boolean> {
  return Object.fromEntries(
    eventWebsiteContentSectionKeys.map((key) => [key, true]),
  ) as Record<EventWebsiteContentSectionKey, boolean>;
}

export function buildDefaultWeddingEventWebsiteContent(
  context: EventWebsiteDefaultsContext = {},
): EventWebsiteContent {
  const rawCoupleNames = firstNonEmpty(
    context.eventContent?.coupleOrCelebrantNames,
    context.event?.title,
    context.client?.name,
  );
  const coupleNames = deriveWeddingNames(rawCoupleNames);
  const hostLine = firstNonEmpty(
    context.eventContent?.heroTitle,
    context.event?.title,
    buildClientWeddingTitle(context.client?.name),
    "Alexander Morales Wedding RSVP",
  );
  const shortHostMessage = firstNonEmpty(
    context.eventContent?.heroSubtitle,
    buildWeddingInvitationMessage(coupleNames.groomName, coupleNames.brideName),
  );
  const eventDate = normalizeDateInput(context.event?.eventDate) || DEFAULT_WEDDING_EVENT_DATE;
  const eventTime = normalizeTimeInput(context.event?.eventTime) || DEFAULT_WEDDING_EVENT_TIME;
  const rsvpDeadline =
    normalizeLocalDateTimeInput(context.event?.rsvpCloseAt) ||
    buildDefaultRsvpDeadline(eventDate, DEFAULT_RSVP_DEADLINE_OFFSET_DAYS);
  const venueName = firstNonEmpty(context.event?.venueName, "The Ruins, Bacolod");
  const venueAddress = firstNonEmpty(
    context.event?.venueAddress,
    extractApplicationLocation(context.application),
    "Talisay City, Negros Occidental, Philippines",
  );
  const contactPerson = firstNonEmpty(context.client?.contactName, context.profile?.fullName, "Anna Santos");
  const contactEmail = firstNonEmpty(context.profile?.email, "hello@example.com");

  return {
    assets: {},
    eventType: DEFAULT_WEDDING_EVENT_TYPE,
    layout: {
      enabledSections: getDefaultWeddingEnabledSections(),
      sectionOrder: getDefaultWeddingSectionOrder(),
    },
    meta: {
      savedAt: null,
      savedBy: null,
    },
    sections: {
      attire_motif: {
        colorMotifNote: "Please wear shades that complement our wedding colors.",
        dressCodeNote: "Formal or semi-formal attire is encouraged.",
        sectionIntro: "We would love to see you in our wedding motif.",
      },
      contact_socials: {
        contactNumber: "",
        contactPerson,
        email: contactEmail,
        facebookUrl: "",
        instagramUrl: "",
        tikTokUrl: "",
      },
      countdown: {
        shortNote: "We can't wait to celebrate with you.",
        title: "Counting down to our special day",
      },
      extra_info: {
        items: [
          {
            details: "Parking is available near the venue entrance.",
            id: "extra-info-parking",
            title: "Parking",
          },
          {
            details: "Please arrive at least 30 minutes before the ceremony.",
            id: "extra-info-reminder",
            title: "Reminder",
          },
        ],
        sectionIntro: "Here are a few helpful notes for our guests.",
        sectionTitle: "Additional Details",
      },
      gift_details: {
        giftNote:
          firstNonEmpty(
            context.eventContent?.giftNote,
            "If you wish to give a gift, a monetary gift would be greatly appreciated as we begin this new chapter together.",
          ),
        options: [
          { id: "gift-option-1", image: null, title: "GCash" },
          { id: "gift-option-2", image: null, title: "Bank Transfer" },
        ],
        sectionIntro: "Your presence is the greatest gift.",
      },
      guestbook: {
        messageBody:
          "Your presence means the world to us. Thank you for celebrating this special day with us.",
        sectionTitle: "A Note from Us",
      },
      host_info: {
        brideName: coupleNames.brideName,
        displayAs: coupleNames.displayAs,
        groomName: coupleNames.groomName,
        hostLine,
        shortHostMessage,
      },
      main_event: {
        endTime: DEFAULT_WEDDING_EVENT_END_TIME,
        eventDate,
        eventLabel: "Wedding Ceremony",
        eventTime,
        rsvpDeadline,
        scheduleNote: firstNonEmpty(
          context.eventContent?.scheduleNote,
          "Please arrive at least 15 minutes before the ceremony starts.",
        ),
      },
      music_effects: {
        musicLink: "",
        musicTitle: "Our Wedding Song",
        playButtonLabel: "Play our song",
        shortNote: "A song that reminds us of our journey together.",
      },
      principal_sponsors: {
        introLine: "We are grateful for the love and guidance of our principal sponsors.",
        names:
          "Mr. Juan Dela Cruz\nMrs. Maria Dela Cruz\nMr. Pedro Santos\nMrs. Ana Santos\nMr. Roberto Reyes\nMrs. Elena Reyes",
      },
      rsvp_form: {
        companionAgeEnabled: false,
        companionLimit: 1,
        companionNameEnabled: true,
        customQuestions: [],
        foodAllergiesEnabled: false,
        messageToHostEnabled: true,
        plusOneEnabled: false,
      },
      secondary_event: {
        address: venueAddress,
        endTime: "21:00",
        mapsLink: "",
        note: "Dinner and program will follow after the ceremony.",
        startTime: "18:00",
        title: "Wedding Reception",
        venueName: "The Ruins Garden Hall",
      },
      story_message: {
        sectionIntro: "A little story about how our journey began.",
        storyBody: firstNonEmpty(
          context.eventContent?.eventStory,
          "From the first hello to this special day, our journey has been filled with simple moments, answered prayers, and love that continued to grow. We are grateful to celebrate this chapter with the people who matter most to us.",
        ),
        storyTitle: "Our Story",
      },
      timeline_program: {
        items: [
          {
            description: "Guests may proceed to the entrance area.",
            id: "timeline-guest-arrival",
            time: "15:00",
            title: "Guest Arrival",
          },
          {
            description: "The wedding ceremony begins.",
            id: "timeline-ceremony",
            time: eventTime,
            title: "Ceremony",
          },
          {
            description: "Dinner and program will follow.",
            id: "timeline-reception",
            time: "18:00",
            title: "Reception",
          },
          {
            description: "Celebrate with food, speeches, and special moments.",
            id: "timeline-dinner-program",
            time: "20:00",
            title: "Dinner & Program",
          },
        ],
      },
      entourage: {
        groups: [
          { groupTitle: "Maid of Honor", id: "entourage-maid-of-honor", names: "Maria Santos" },
          { groupTitle: "Best Man", id: "entourage-best-man", names: "Juan Dela Cruz" },
          {
            groupTitle: "Bridesmaids",
            id: "entourage-bridesmaids",
            names: "Ana Cruz, Bella Reyes, Carla Lim",
          },
          {
            groupTitle: "Groomsmen",
            id: "entourage-groomsmen",
            names: "Marco Reyes, Paolo Santos, Luis Garcia",
          },
        ],
        introLine: "Meet the family and friends standing with us on our wedding day.",
      },
      venue: {
        address: venueAddress,
        arrivalNote: firstNonEmpty(
          context.eventContent?.venueNote,
          "Parking is available near the entrance. Please follow the event signage upon arrival.",
        ),
        mapsLink: "",
        venueName,
      },
    },
    version: 1,
  };
}

function buildClientWeddingTitle(clientName?: string | null) {
  const name = normalizeText(clientName);

  if (!name) {
    return "";
  }

  return `${name} Wedding RSVP`;
}

function buildDefaultRsvpDeadline(eventDate: string, offsetDays: number) {
  const [year, month, day] = eventDate.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setUTCDate(date.getUTCDate() - offsetDays);

  const yyyy = date.getUTCFullYear();
  const mm = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getUTCDate()}`.padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${DEFAULT_RSVP_DEADLINE_TIME}`;
}

function buildWeddingInvitationMessage(groomName: string, brideName: string) {
  return `Together with their families, ${groomName} and ${brideName} invite you to celebrate their wedding day.`;
}

function deriveWeddingNames(rawValue?: string | null) {
  const normalized = normalizeText(rawValue);

  if (!normalized) {
    return {
      brideName: "Maria",
      displayAs: "Juan & Maria",
      groomName: "Juan",
    };
  }

  const ampersandMatch = normalized
    .split(/\s*&\s*|\s+and\s+/i)
    .map((item) => item.trim())
    .filter(Boolean);

  if (ampersandMatch.length >= 2) {
    return {
      brideName: ampersandMatch[1] ?? "Maria",
      displayAs: normalized,
      groomName: ampersandMatch[0] ?? "Juan",
    };
  }

  return {
    brideName: "Maria",
    displayAs: normalized,
    groomName: ampersandMatch[0] ?? normalized,
  };
}

function extractApplicationLocation(application?: { [key: string]: unknown } | null) {
  if (!application || typeof application !== "object") {
    return "";
  }

  const eventLocation = application.eventLocation;
  return typeof eventLocation === "string" ? normalizeText(eventLocation) : "";
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = normalizeText(value);

    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function normalizeDateInput(value?: string | null) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return "";
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : "";
}

function normalizeLocalDateTimeInput(value?: string | null) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
    return normalized;
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function normalizeText(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTimeInput(value?: string | null) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return "";
  }

  const timeMatch = normalized.match(/^(\d{2}:\d{2})(?::\d{2})?$/);
  return timeMatch?.[1] ?? "";
}
