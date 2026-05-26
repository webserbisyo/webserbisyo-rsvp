import type { EventWebsiteSectionKey } from "@/config/event-website-sections";

export const DEFAULT_WEDDING_EVENT_TYPE = "wedding";
export const DEFAULT_RSVP_DEADLINE_OFFSET_DAYS = 30;
export const DEFAULT_RSVP_DEADLINE_TIME = "18:00";
export const DEFAULT_EVENT_WEBSITE_GUESTBOOK_TITLE = "Guestbook";
export const DEFAULT_EVENT_WEBSITE_GUESTBOOK_INTRO =
  "Read warm wishes and messages from our guests.";
export const DEFAULT_EVENT_WEBSITE_GUESTBOOK_EMPTY_STATE =
  "Approved guest messages will appear here soon.";

export const eventWebsiteContentSectionKeys = [
  "host_info",
  "countdown",
  "music_effects",
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
] as const satisfies readonly EventWebsiteSectionKey[];

export type EventWebsiteContentSectionKey = (typeof eventWebsiteContentSectionKeys)[number];
export type EventWebsiteContentEventType = typeof DEFAULT_WEDDING_EVENT_TYPE;

export const eventWebsiteCustomQuestionFieldTypes = [
  "Short text",
  "Long text",
  "Number",
  "Yes / No",
  "Single choice",
  "Multiple choice",
] as const;

export type EventWebsiteCustomQuestionFieldType =
  (typeof eventWebsiteCustomQuestionFieldTypes)[number];

const eventWebsiteContentSectionKeySet = new Set<string>(eventWebsiteContentSectionKeys);

export function isEventWebsiteContentSectionKey(
  value: string,
): value is EventWebsiteContentSectionKey {
  return eventWebsiteContentSectionKeySet.has(value);
}

export type EventWebsiteImageAsset = {
  alt?: string;
  path: string;
  url?: string;
};

export type EventWebsiteHostInfoSection = {
  brideName: string;
  displayAs: string;
  groomName: string;
  hostLine: string;
  shortHostMessage: string;
};

export type EventWebsiteCountdownSection = {
  shortNote: string;
  title: string;
};

export type EventWebsiteMusicEffectsSection = {
  musicLink: string;
  musicTitle: string;
  playButtonLabel: string;
  shortNote: string;
};

export type EventWebsiteMainEventSection = {
  endTime: string;
  eventDate: string;
  eventLabel: string;
  eventTime: string;
  rsvpDeadline: string;
  scheduleNote: string;
};

export type EventWebsiteVenueSection = {
  address: string;
  arrivalNote: string;
  mapsLink: string;
  venueName: string;
};

export type EventWebsiteSecondaryEventSection = {
  address: string;
  endTime: string;
  mapsLink: string;
  note: string;
  startTime: string;
  title: string;
  venueName: string;
};

export type EventWebsiteTimelineItem = {
  description: string;
  id: string;
  time: string;
  title: string;
};

export type EventWebsiteTimelineProgramSection = {
  items: EventWebsiteTimelineItem[];
};

export type EventWebsiteEntourageGroup = {
  groupTitle: string;
  id: string;
  names: string;
};

export type EventWebsiteEntourageSection = {
  groups: EventWebsiteEntourageGroup[];
  introLine: string;
};

export type EventWebsitePrincipalSponsorsSection = {
  introLine: string;
  names: string;
};

export type EventWebsiteAttireMotifSection = {
  colorMotifNote: string;
  dressCodeNote: string;
  sectionIntro: string;
};

export type EventWebsiteExtraInfoItem = {
  details: string;
  id: string;
  title: string;
};

export type EventWebsiteExtraInfoSection = {
  items: EventWebsiteExtraInfoItem[];
  sectionIntro: string;
  sectionTitle: string;
};

export type EventWebsiteCustomQuestion = {
  fieldType: EventWebsiteCustomQuestionFieldType;
  id: string;
  label: string;
  options: string[];
  required: boolean;
};

export type EventWebsiteRsvpFormSection = {
  companionAgeEnabled: boolean;
  companionLimit: number;
  companionNameEnabled: boolean;
  customQuestions: EventWebsiteCustomQuestion[];
  emailEnabled: boolean;
  emailRequired: boolean;
  foodAllergiesEnabled: boolean;
  messageToHostEnabled: boolean;
  phoneEnabled: boolean;
  phoneRequired: boolean;
  plusOneEnabled: boolean;
};

export type EventWebsiteGiftOption = {
  id: string;
  image: EventWebsiteImageAsset | null;
  title: string;
};

export type EventWebsiteGiftDetailsSection = {
  giftNote: string;
  options: EventWebsiteGiftOption[];
  sectionIntro: string;
};

export type EventWebsiteGuestbookSection = {
  emptyStateMessage: string;
  sectionIntro: string;
  sectionTitle: string;
};

export type EventWebsiteGuestbookMessage = {
  approvedAt: string | null;
  guestName: string;
  id: string;
  message: string;
  submittedAt: string | null;
};

export type EventWebsiteStoryMessageSection = {
  sectionIntro: string;
  storyBody: string;
  storyTitle: string;
};

export type EventWebsiteContactSocialsSection = {
  contactNumber: string;
  contactPerson: string;
  email: string;
  facebookUrl: string;
  instagramUrl: string;
  tikTokUrl: string;
};

export type EventWebsiteSections = {
  attire_motif: EventWebsiteAttireMotifSection;
  contact_socials: EventWebsiteContactSocialsSection;
  countdown: EventWebsiteCountdownSection;
  extra_info: EventWebsiteExtraInfoSection;
  gift_details: EventWebsiteGiftDetailsSection;
  guestbook: EventWebsiteGuestbookSection;
  host_info: EventWebsiteHostInfoSection;
  main_event: EventWebsiteMainEventSection;
  music_effects: EventWebsiteMusicEffectsSection;
  principal_sponsors: EventWebsitePrincipalSponsorsSection;
  rsvp_form: EventWebsiteRsvpFormSection;
  secondary_event: EventWebsiteSecondaryEventSection;
  story_message: EventWebsiteStoryMessageSection;
  timeline_program: EventWebsiteTimelineProgramSection;
  entourage: EventWebsiteEntourageSection;
  venue: EventWebsiteVenueSection;
};

export type EventWebsiteLayout = {
  enabledSections: Record<EventWebsiteContentSectionKey, boolean>;
  sectionOrder: EventWebsiteContentSectionKey[];
};

export type EventWebsiteContentAssets = Record<string, never>;

export type EventWebsiteContentMeta = {
  savedAt: string | null;
  savedBy: string | null;
};

export type EventWebsiteContent = {
  assets: EventWebsiteContentAssets;
  eventType: EventWebsiteContentEventType;
  layout: EventWebsiteLayout;
  meta: EventWebsiteContentMeta;
  sections: EventWebsiteSections;
  version: 1;
};

export type EventWebsiteCanonicalEventPatch = {
  event_date: string | null;
  event_time: string | null;
  rsvp_close_at: string | null;
  venue_address: string | null;
  venue_name: string | null;
};

export type EventWebsiteDefaultsContext = {
  application?: { [key: string]: unknown } | null;
  client?: {
    contactName?: string | null;
    name?: string | null;
  } | null;
  event?: {
    eventDate?: string | null;
    eventTime?: string | null;
    eventType?: string | null;
    maxGuestCount?: number | null;
    rsvpCloseAt?: string | null;
    title?: string | null;
    venueAddress?: string | null;
    venueName?: string | null;
  } | null;
  eventContent?: {
    contactNote?: string | null;
    coupleOrCelebrantNames?: string | null;
    dressCode?: string | null;
    eventStory?: string | null;
    giftNote?: string | null;
    heroSubtitle?: string | null;
    heroTitle?: string | null;
    rsvpNote?: string | null;
    scheduleNote?: string | null;
    themeKey?: string | null;
    venueNote?: string | null;
  } | null;
  profile?: {
    email?: string | null;
    fullName?: string | null;
  } | null;
};
