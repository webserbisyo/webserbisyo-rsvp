import {
  eventWebsiteContentSectionKeys,
  type EventWebsiteContent,
} from "@/lib/event-website/types";

export type EventWebsiteOperationalStatusState =
  | "unsaved_changes"
  | "draft_saved_unpublished"
  | "draft_newer_than_published"
  | "published_up_to_date"
  | "unpublished"
  | "draft_saved";

export type EventWebsiteOperationalStatusTone = "neutral" | "success" | "warning";

export type EventWebsiteOperationalStatus = {
  description: string;
  label: string;
  state: EventWebsiteOperationalStatusState;
  tone: EventWebsiteOperationalStatusTone;
};

export type EventWebsiteSectionSummary = {
  activeSectionCount: number;
  progressPercent: number;
  totalSectionCount: number;
};

type WorkspaceStatusInput = {
  isDirty: boolean;
  isPublished: boolean;
  publishedAt?: string | null;
  savedAt?: string | null;
};

type WebsiteAccessStatusInput = {
  isPublished: boolean;
  publishedAt?: string | null;
  savedAt?: string | null;
};

const requiredSections = new Set(["host_info", "main_event", "venue", "rsvp_form"]);

export function summarizeEventWebsiteSections(
  content: EventWebsiteContent,
): EventWebsiteSectionSummary {
  const activeSectionCount = eventWebsiteContentSectionKeys.filter(
    (sectionKey) => requiredSections.has(sectionKey) || content.layout.enabledSections[sectionKey],
  ).length;
  const totalSectionCount = eventWebsiteContentSectionKeys.length;

  return {
    activeSectionCount,
    progressPercent: Math.round((activeSectionCount / totalSectionCount) * 100),
    totalSectionCount,
  };
}

export function getEventWebsiteSavedAt(content: EventWebsiteContent | null | undefined) {
  return normalizeIsoDateString(content?.meta.savedAt);
}

export function getEventWebsiteWorkspaceStatus(
  input: WorkspaceStatusInput,
): EventWebsiteOperationalStatus {
  if (input.isDirty) {
    return {
      description: "Save your latest editor changes before they can be published.",
      label: "Unsaved changes",
      state: "unsaved_changes",
      tone: "warning",
    };
  }

  if (!input.isPublished) {
    return {
      description: "Your latest draft is saved. Publish from Website Access when you're ready.",
      label: "Draft saved",
      state: "draft_saved_unpublished",
      tone: "neutral",
    };
  }

  if (isDraftNewerThanPublished(input.savedAt, input.publishedAt)) {
    return {
      description: "Your latest saved draft is newer than the public snapshot.",
      label: "Draft changes not published",
      state: "draft_newer_than_published",
      tone: "warning",
    };
  }

  return {
    description: "The public fallback page matches the latest saved draft.",
    label: "Published and up to date",
    state: "published_up_to_date",
    tone: "success",
  };
}

export function getWebsiteAccessPublishStatus(
  input: WebsiteAccessStatusInput,
): EventWebsiteOperationalStatus {
  if (!input.isPublished) {
    return {
      description: "No public snapshot is live yet.",
      label: "Unpublished",
      state: "unpublished",
      tone: "neutral",
    };
  }

  if (isDraftNewerThanPublished(input.savedAt, input.publishedAt)) {
    return {
      description: "The public page is live, but a newer saved draft is waiting to be published.",
      label: "Draft changes not published",
      state: "draft_newer_than_published",
      tone: "warning",
    };
  }

  return {
    description: "The published snapshot is live and matches the latest saved draft.",
    label: "Published and up to date",
    state: "published_up_to_date",
    tone: "success",
  };
}

function isDraftNewerThanPublished(savedAt?: string | null, publishedAt?: string | null) {
  const savedTime = parseIsoDateString(savedAt);
  const publishedTime = parseIsoDateString(publishedAt);

  if (savedTime === null || publishedTime === null) {
    return false;
  }

  return savedTime > publishedTime;
}

function normalizeIsoDateString(value?: string | null) {
  return parseIsoDateString(value) === null ? null : (value ?? null);
}

function parseIsoDateString(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}
