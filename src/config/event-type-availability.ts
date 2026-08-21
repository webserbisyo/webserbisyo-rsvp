export const EVENT_TYPE_VALUES = [
  "wedding",
  "birthday",
  "debut",
  "baptism",
  "reunion",
  "anniversary",
  "corporate",
  "other",
] as const;

export type EventType = (typeof EVENT_TYPE_VALUES)[number];
export type EventTypeAvailabilityStatus = "available" | "in_development" | "hidden";

export type EventTypeAvailability = {
  applicationEnabled: boolean;
  comingSoonLabel: string;
  dashboardBuilderEnabled: boolean;
  eventType: EventType;
  label: string;
  lockedDescription: string;
  lockedTitle: string;
  publicRenderingEnabled: boolean;
  status: EventTypeAvailabilityStatus;
};

const defaultComingSoonLabel = "Coming soon";

const eventTypeAvailabilityMap: Record<EventType, EventTypeAvailability> = {
  anniversary: {
    applicationEnabled: false,
    comingSoonLabel: defaultComingSoonLabel,
    dashboardBuilderEnabled: false,
    eventType: "anniversary",
    label: "Anniversary",
    lockedDescription:
      "Wedding websites are available now. This event type is already supported in our system, but its dedicated website builder is still being prepared.",
    lockedTitle: "Anniversary Event Website is in development",
    publicRenderingEnabled: false,
    status: "in_development",
  },
  baptism: {
    applicationEnabled: true,
    comingSoonLabel: defaultComingSoonLabel,
    dashboardBuilderEnabled: true,
    eventType: "baptism",
    label: "Christening / Baptism",
    lockedDescription: "",
    lockedTitle: "",
    publicRenderingEnabled: true,
    status: "available",
  },
  birthday: {
    applicationEnabled: true,
    comingSoonLabel: defaultComingSoonLabel,
    dashboardBuilderEnabled: true,
    eventType: "birthday",
    label: "Birthday",
    lockedDescription: "",
    lockedTitle: "",
    publicRenderingEnabled: true,
    status: "available",
  },
  corporate: {
    applicationEnabled: false,
    comingSoonLabel: defaultComingSoonLabel,
    dashboardBuilderEnabled: false,
    eventType: "corporate",
    label: "Corporate",
    lockedDescription:
      "Wedding websites are available now. This event type is already supported in our system, but its dedicated website builder is still being prepared.",
    lockedTitle: "Corporate Event Website is in development",
    publicRenderingEnabled: false,
    status: "in_development",
  },
  debut: {
    applicationEnabled: true,
    comingSoonLabel: defaultComingSoonLabel,
    dashboardBuilderEnabled: true,
    eventType: "debut",
    label: "Debut / 18th Birthday",
    lockedDescription: "",
    lockedTitle: "",
    publicRenderingEnabled: true,
    status: "available",
  },
  other: {
    applicationEnabled: false,
    comingSoonLabel: defaultComingSoonLabel,
    dashboardBuilderEnabled: false,
    eventType: "other",
    label: "Other",
    lockedDescription:
      "Wedding websites are available now. This event type is already supported in our system, but its dedicated website builder is still being prepared.",
    lockedTitle: "This Event Website is in development",
    publicRenderingEnabled: false,
    status: "in_development",
  },
  reunion: {
    applicationEnabled: false,
    comingSoonLabel: defaultComingSoonLabel,
    dashboardBuilderEnabled: false,
    eventType: "reunion",
    label: "Reunion",
    lockedDescription:
      "Wedding websites are available now. This event type is already supported in our system, but its dedicated website builder is still being prepared.",
    lockedTitle: "Reunion Event Website is in development",
    publicRenderingEnabled: false,
    status: "in_development",
  },
  wedding: {
    applicationEnabled: true,
    comingSoonLabel: "",
    dashboardBuilderEnabled: true,
    eventType: "wedding",
    label: "Wedding",
    lockedDescription: "",
    lockedTitle: "",
    publicRenderingEnabled: true,
    status: "available",
  },
};

export const unsupportedBuilderMessage = "This event website type is still in development.";
export const unsupportedApplicationMessage =
  "This event type is coming soon. Wedding applications are available right now.";
export const unsupportedPublicRenderingMessage =
  "This event website is not available for this event type yet.";

export function isKnownEventType(value: string | null | undefined): value is EventType {
  return EVENT_TYPE_VALUES.includes(value as EventType);
}

export function getEventTypeAvailability(
  eventType: string | null | undefined,
): EventTypeAvailability | null {
  return isKnownEventType(eventType) ? eventTypeAvailabilityMap[eventType] : null;
}

export function isWeddingEventType(eventType: string | null | undefined) {
  return eventType === "wedding";
}

export function isApplicationEventTypeEnabled(eventType: string | null | undefined) {
  return getEventTypeAvailability(eventType)?.applicationEnabled ?? false;
}

export function isDashboardBuilderEventTypeEnabled(eventType: string | null | undefined) {
  return getEventTypeAvailability(eventType)?.dashboardBuilderEnabled ?? false;
}

export function isPublicRenderingEventTypeEnabled(eventType: string | null | undefined) {
  return getEventTypeAvailability(eventType)?.publicRenderingEnabled ?? false;
}

export function getAvailableApplicationEventTypes(): EventType[] {
  return EVENT_TYPE_VALUES.filter(
    (eventType) => eventTypeAvailabilityMap[eventType].applicationEnabled,
  );
}

export function getApplicationEventTypeOptions() {
  return EVENT_TYPE_VALUES.map((eventType) => {
    const availability = eventTypeAvailabilityMap[eventType];

    return {
      disabled: !availability.applicationEnabled,
      eventType,
      label: availability.label,
      status: availability.status,
      statusLabel: availability.applicationEnabled ? null : availability.comingSoonLabel,
    };
  });
}

export function assertApplicationEventTypeEnabled(eventType: string | null | undefined) {
  if (!isApplicationEventTypeEnabled(eventType)) {
    throw new Error(unsupportedApplicationMessage);
  }
}

export function assertDashboardBuilderEventTypeEnabled(eventType: string | null | undefined) {
  if (!isDashboardBuilderEventTypeEnabled(eventType)) {
    throw new Error(unsupportedBuilderMessage);
  }
}
