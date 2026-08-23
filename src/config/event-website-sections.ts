import type { LucideIcon } from "lucide-react";
import type { EventType } from "@/config/event-type-availability";
import {
  Baby,
  BookHeart,
  BriefcaseBusiness,
  Cake,
  CalendarHeart,
  CalendarDays,
  Church,
  CircleHelp,
  ClipboardCheck,
  Crown,
  Gift,
  HandCoins,
  Heart,
  Images,
  ListOrdered,
  MapPin,
  MessageCircleHeart,
  Music,
  Palette,
  PartyPopper,
  Phone,
  Presentation,
  Shirt,
  Sparkles,
  Timer,
  UserRound,
  UsersRound,
  Utensils,
} from "lucide-react";

export type EventWebsiteEventType = EventType;

export type EventWebsiteRequiredSectionKey = "host_info" | "main_event" | "venue" | "rsvp_form";

export type EventWebsiteSystemSectionKey = "overview";

export type EventWebsiteOptionalSectionKey =
  | "countdown"
  | "secondary_event"
  | "timeline_program"
  | "entourage"
  | "principal_sponsors"
  | "story_message"
  | "attire_motif"
  | "gallery"
  | "guestbook"
  | "gift_details"
  | "extra_info"
  | "music_effects"
  | "style_theme"
  | "contact_socials"
  | "eighteen_roses_candles"
  | "debut_court"
  | "godparents"
  | "speakers_presenters"
  | "food_dietary";

export type EventWebsiteSectionKey =
  | EventWebsiteSystemSectionKey
  | EventWebsiteRequiredSectionKey
  | EventWebsiteOptionalSectionKey;

export type EventWebsiteSectionDefinition = {
  key: EventWebsiteSectionKey;
  label: string;
  helper: string;
  icon: LucideIcon;
  required: boolean;
  defaultEnabled: boolean;
  comingSoon?: boolean;
  generated?: boolean;
  toggleableWhenComingSoon?: boolean;
};

type EventWebsiteSectionOverride = {
  helper?: string;
  icon?: LucideIcon;
  label: string;
};

type EventWebsiteOptionalConfig = {
  key: EventWebsiteOptionalSectionKey;
  defaultEnabled?: boolean;
  comingSoon?: boolean;
  helper?: string;
  icon?: LucideIcon;
  label?: string;
  toggleableWhenComingSoon?: boolean;
};

type EventWebsiteTypeConfig = {
  required: Record<EventWebsiteRequiredSectionKey, EventWebsiteSectionOverride>;
  optionalDefaults: EventWebsiteOptionalConfig[];
};

export type ResolvedEventWebsiteSections = {
  eventType: EventWebsiteEventType | "generic";
  futureDevelopmentSections: EventWebsiteSectionDefinition[];
  requiredSections: EventWebsiteSectionDefinition[];
  optionalSections: EventWebsiteSectionDefinition[];
};

export const generatedOverviewSection: EventWebsiteSectionDefinition = {
  comingSoon: true,
  defaultEnabled: false,
  generated: true,
  helper: "Overview will be generated from your event details.",
  icon: Sparkles,
  key: "overview",
  label: "Overview",
  required: false,
};

const requiredBaseSections: Record<
  EventWebsiteRequiredSectionKey,
  Omit<EventWebsiteSectionDefinition, "label" | "helper">
> = {
  host_info: {
    defaultEnabled: true,
    icon: UserRound,
    key: "host_info",
    required: true,
  },
  main_event: {
    defaultEnabled: true,
    icon: CalendarDays,
    key: "main_event",
    required: true,
  },
  venue: {
    defaultEnabled: true,
    icon: MapPin,
    key: "venue",
    required: true,
  },
  rsvp_form: {
    defaultEnabled: true,
    icon: ClipboardCheck,
    key: "rsvp_form",
    required: true,
  },
};

const requiredSectionOrder: EventWebsiteRequiredSectionKey[] = [
  "host_info",
  "main_event",
  "venue",
  "rsvp_form",
];

const optionalBaseSections: Record<
  EventWebsiteOptionalSectionKey,
  Omit<EventWebsiteSectionDefinition, "label" | "helper"> & { helper: string; label: string }
> = {
  attire_motif: {
    defaultEnabled: true,
    helper: "Attire guidance, colors, and theme notes.",
    icon: Shirt,
    key: "attire_motif",
    label: "Attire / Dress Code",
    required: false,
  },
  contact_socials: {
    defaultEnabled: true,
    helper: "Contact links and social channels.",
    icon: Phone,
    key: "contact_socials",
    label: "Contact & Socials",
    required: false,
  },
  countdown: {
    defaultEnabled: true,
    helper: "Countdown timer leading guests toward the event date.",
    icon: Timer,
    key: "countdown",
    label: "Countdown",
    required: false,
  },
  debut_court: {
    defaultEnabled: false,
    helper: "Debut court members and roles.",
    icon: UsersRound,
    key: "debut_court",
    label: "Debut Court",
    required: false,
  },
  eighteen_roses_candles: {
    defaultEnabled: false,
    helper: "18 Roses, 18 Candles, and related debut traditions.",
    icon: Sparkles,
    key: "eighteen_roses_candles",
    label: "18 Roses / 18 Candles",
    required: false,
  },
  entourage: {
    defaultEnabled: true,
    helper: "Wedding party and entourage members.",
    icon: UsersRound,
    key: "entourage",
    label: "Entourage",
    required: false,
  },
  extra_info: {
    defaultEnabled: true,
    helper: "Extra reminders, FAQs, or guest notes.",
    icon: CircleHelp,
    key: "extra_info",
    label: "Extra Info",
    required: false,
  },
  gallery: {
    comingSoon: true,
    defaultEnabled: false,
    helper: "Photo highlights and visual memories.",
    icon: Images,
    key: "gallery",
    label: "Gallery",
    required: false,
    toggleableWhenComingSoon: true,
  },
  food_dietary: {
    defaultEnabled: true,
    helper: "Food notes and dietary needs.",
    icon: Utensils,
    key: "food_dietary",
    label: "Food / Dietary Needs",
    required: false,
  },
  gift_details: {
    defaultEnabled: true,
    helper: "Gift registry, cash gift, or contribution details.",
    icon: Gift,
    key: "gift_details",
    label: "Gift Details",
    required: false,
  },
  godparents: {
    defaultEnabled: false,
    helper: "Godparents, Ninong, and Ninang details.",
    icon: Baby,
    key: "godparents",
    label: "Godparents / Ninong & Ninang",
    required: false,
  },
  guestbook: {
    defaultEnabled: true,
    helper: "Guest messages and well-wishes.",
    icon: MessageCircleHeart,
    key: "guestbook",
    label: "Guestbook",
    required: false,
  },
  music_effects: {
    defaultEnabled: true,
    helper: "Background music and subtle page effects.",
    icon: Music,
    key: "music_effects",
    label: "Music & Effects",
    required: false,
  },
  principal_sponsors: {
    defaultEnabled: true,
    helper: "Principal sponsors and honored participants.",
    icon: HandCoins,
    key: "principal_sponsors",
    label: "Principal Sponsors",
    required: false,
  },
  secondary_event: {
    defaultEnabled: true,
    helper: "Second location or follow-up celebration details.",
    icon: Utensils,
    key: "secondary_event",
    label: "Reception",
    required: false,
  },
  speakers_presenters: {
    defaultEnabled: true,
    helper: "Speakers, presenters, and featured participants.",
    icon: Presentation,
    key: "speakers_presenters",
    label: "Speakers / Presenters",
    required: false,
  },
  story_message: {
    defaultEnabled: true,
    helper: "Story, message, or event background.",
    icon: BookHeart,
    key: "story_message",
    label: "Love Story",
    required: false,
  },
  style_theme: {
    comingSoon: true,
    defaultEnabled: false,
    helper: "Template colors, typography, and theme controls.",
    icon: Palette,
    key: "style_theme",
    label: "Style & Theme",
    required: false,
  },
  timeline_program: {
    defaultEnabled: true,
    helper: "Program flow, timeline, and key moments.",
    icon: ListOrdered,
    key: "timeline_program",
    label: "Timeline / Program",
    required: false,
  },
};

const genericRequiredConfig: EventWebsiteTypeConfig["required"] = {
  host_info: {
    helper: "Host names and invitation display details.",
    label: "Host Info",
  },
  main_event: {
    helper: "Main event date, time, and RSVP deadline.",
    label: "Main Event",
  },
  rsvp_form: {
    helper: "RSVP fields and response instructions.",
    label: "RSVP Form",
  },
  venue: {
    helper: "Venue name, address, and guest arrival guidance.",
    label: "Venue",
  },
};

const sharedGenericOptionalDefaults: EventWebsiteOptionalConfig[] = [
  { key: "countdown" },
  { key: "timeline_program" },
  { key: "guestbook" },
  { key: "gift_details" },
  { key: "contact_socials" },
  { key: "music_effects" },
  { key: "extra_info" },
];

const futureDevelopmentOptionalKeys: EventWebsiteOptionalSectionKey[] = ["style_theme"];

function resolveFutureDevelopmentSections(): EventWebsiteSectionDefinition[] {
  return [
    generatedOverviewSection,
    ...futureDevelopmentOptionalKeys.map((key) => ({
      ...optionalBaseSections[key],
      comingSoon: true,
      defaultEnabled: false,
    })),
  ];
}

export const eventWebsiteTypeConfig: Record<
  EventWebsiteEventType | "generic",
  EventWebsiteTypeConfig
> = {
  anniversary: {
    optionalDefaults: [
      { key: "countdown" },
      { key: "timeline_program" },
      { key: "attire_motif", label: "Attire / Dress Code" },
      { key: "guestbook" },
      { key: "gift_details" },
      { key: "contact_socials" },
      { key: "music_effects" },
      { key: "extra_info" },
    ],
    required: {
      ...genericRequiredConfig,
      host_info: {
        helper: "Celebrant or couple details for the invitation.",
        icon: Heart,
        label: "Couple Info",
      },
      main_event: {
        helper: "Anniversary date, time, and RSVP deadline.",
        label: "Anniversary Celebration",
      },
    },
  },
  baptism: {
    optionalDefaults: [
      { key: "countdown" },
      { defaultEnabled: false, key: "music_effects" },
      { defaultEnabled: false, key: "gallery" },
      {
        defaultEnabled: false,
        helper: "Share a dedication message, thanksgiving prayer, or milestone reflection for the child.",
        key: "story_message",
        label: "Parents' Dedication",
      },
      { defaultEnabled: false, key: "secondary_event", label: "Reception Banquet" },
      { key: "timeline_program" },
      {
        defaultEnabled: false,
        helper: "List the godparents, sponsors, and mentors blessed to guide the child.",
        key: "godparents",
        label: "Godparents",
      },
      { key: "attire_motif", label: "Theme / Dress Code" },
      { defaultEnabled: false, key: "extra_info" },
      { key: "gift_details" },
      { key: "guestbook", label: "Prayers & Blessings" },
      { key: "contact_socials" },
    ],
    required: {
      ...genericRequiredConfig,
      host_info: {
        helper: "Child and parent or guardian details for the invitation.",
        icon: Baby,
        label: "Child & Parents",
      },
      main_event: {
        helper: "Baptism or christening date, time, and RSVP deadline.",
        icon: Church,
        label: "Christening Ceremony",
      },
    },
  },
  birthday: {
    optionalDefaults: [
      { key: "countdown" },
      { defaultEnabled: false, key: "music_effects" },
      { defaultEnabled: false, key: "gallery" },
      {
        defaultEnabled: false,
        helper: "Share a short milestone reflection, thanksgiving message, or journey story.",
        key: "story_message",
        label: "Celebrant Story",
      },
      { defaultEnabled: false, key: "secondary_event", label: "Reception / After-Party" },
      { key: "timeline_program" },
      {
        defaultEnabled: false,
        helper: "Godparents, mentors, and honored guests supporting the celebrant.",
        key: "principal_sponsors",
        label: "Special Sponsors",
      },
      { key: "attire_motif", label: "Theme / Dress Code" },
      { defaultEnabled: false, key: "extra_info" },
      { key: "gift_details" },
      { key: "guestbook", label: "Birthday Wishes" },
      { key: "contact_socials" },
    ],
    required: {
      ...genericRequiredConfig,
      host_info: {
        helper: "Celebrant details for the invitation.",
        icon: Cake,
        label: "Celebrant Info",
      },
      main_event: {
        helper: "Birthday date, time, and RSVP deadline.",
        icon: PartyPopper,
        label: "Birthday Celebration",
      },
    },
  },
  corporate: {
    optionalDefaults: [
      { key: "timeline_program", label: "Agenda / Program" },
      { key: "speakers_presenters" },
      { key: "food_dietary" },
      { key: "contact_socials" },
      { defaultEnabled: false, key: "music_effects" },
      { key: "extra_info" },
    ],
    required: {
      ...genericRequiredConfig,
      host_info: {
        helper: "Organizer, company, and contact display details.",
        icon: BriefcaseBusiness,
        label: "Organizer Info",
      },
      main_event: {
        helper: "Main session date, time, and RSVP deadline.",
        icon: Presentation,
        label: "Main Session",
      },
    },
  },
  debut: {
    optionalDefaults: [
      { key: "countdown" },
      { defaultEnabled: false, key: "music_effects" },
      { defaultEnabled: false, key: "gallery" },
      {
        defaultEnabled: false,
        helper: "Share a milestone journey, childhood reflection, or thanksgiving message for your 18th birthday.",
        key: "story_message",
        label: "Debutant Story",
      },
      { defaultEnabled: false, key: "secondary_event", label: "Reception" },
      { key: "timeline_program" },
      { key: "eighteen_roses_candles", label: "18 Roses / 18 Candles" },
      { key: "debut_court", label: "Debut Court" },
      {
        defaultEnabled: false,
        helper: "Godparents, mentors, and honored guests supporting the debutant.",
        key: "principal_sponsors",
        label: "Special Sponsors",
      },
      { key: "attire_motif", label: "Theme / Dress Code" },
      { defaultEnabled: false, key: "extra_info" },
      { key: "gift_details" },
      { key: "guestbook", label: "Debut Wishes" },
      { key: "contact_socials" },
    ],
    required: {
      ...genericRequiredConfig,
      host_info: {
        helper: "Debutant details for the invitation.",
        icon: Crown,
        label: "Debutant Info",
      },
      main_event: {
        helper: "Debut program date, time, and RSVP deadline.",
        icon: ListOrdered,
        label: "Debut Program",
      },
    },
  },
  generic: {
    optionalDefaults: sharedGenericOptionalDefaults,
    required: genericRequiredConfig,
  },
  other: {
    optionalDefaults: sharedGenericOptionalDefaults,
    required: genericRequiredConfig,
  },
  reunion: {
    optionalDefaults: [
      { key: "countdown" },
      { key: "timeline_program" },
      { key: "guestbook" },
      { key: "gift_details" },
      { key: "contact_socials" },
      { key: "music_effects" },
      { key: "extra_info" },
      { key: "attire_motif", label: "Attire / Dress Code" },
    ],
    required: genericRequiredConfig,
  },
  wedding: {
    optionalDefaults: [
      { key: "countdown" },
      { key: "music_effects" },
      {
        key: "gallery",
        comingSoon: true,
        defaultEnabled: false,
        toggleableWhenComingSoon: true,
      },
      { key: "secondary_event", label: "Reception" },
      { key: "timeline_program" },
      { key: "entourage" },
      { key: "principal_sponsors" },
      { key: "attire_motif" },
      { key: "extra_info" },
      { key: "gift_details" },
      { key: "guestbook" },
      { key: "story_message", label: "Love Story" },
      { key: "contact_socials" },
    ],
    required: {
      ...genericRequiredConfig,
      host_info: {
        helper: "Names and details for the couple.",
        icon: Heart,
        label: "Couple Info",
      },
      main_event: {
        helper: "Wedding ceremony date, time, and RSVP deadline.",
        icon: CalendarHeart,
        label: "Ceremony",
      },
    },
  },
};

export function normalizeEventWebsiteEventType(
  eventType: string | null | undefined,
): EventWebsiteEventType | "generic" {
  if (
    eventType === "wedding" ||
    eventType === "debut" ||
    eventType === "birthday" ||
    eventType === "baptism" ||
    eventType === "reunion" ||
    eventType === "anniversary" ||
    eventType === "corporate" ||
    eventType === "other"
  ) {
    return eventType;
  }

  return "generic";
}

export function resolveEventWebsiteSections(
  eventType: string | null | undefined,
): ResolvedEventWebsiteSections {
  const normalizedEventType = normalizeEventWebsiteEventType(eventType);
  const config = eventWebsiteTypeConfig[normalizedEventType];

  return {
    eventType: normalizedEventType,
    futureDevelopmentSections: resolveFutureDevelopmentSections(),
    optionalSections: config.optionalDefaults.map(resolveOptionalSection),
    requiredSections: requiredSectionOrder.map((key) => {
      const base = requiredBaseSections[key];
      const override = config.required[key];

      return {
        ...base,
        helper: override.helper ?? genericRequiredConfig[key].helper ?? "",
        icon: override.icon ?? base.icon,
        label: override.label,
      };
    }),
  };
}

function resolveOptionalSection(config: EventWebsiteOptionalConfig): EventWebsiteSectionDefinition {
  const base = optionalBaseSections[config.key];

  return {
    ...base,
    comingSoon: config.comingSoon ?? base.comingSoon,
    defaultEnabled: config.defaultEnabled ?? base.defaultEnabled,
    helper: config.helper ?? base.helper,
    icon: config.icon ?? base.icon,
    label: config.label ?? base.label,
    toggleableWhenComingSoon: config.toggleableWhenComingSoon ?? base.toggleableWhenComingSoon,
  };
}
