import type { DbVisibilityMode, VisibilityMode } from "./website-access-types";

export function formatWebsiteAccessDate(value: Date | null) {
  if (!value) {
    return "Not published yet";
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(value);
}

export function mapAppVisibilityToDb(visibility: VisibilityMode): DbVisibilityMode | null {
  switch (visibility) {
    case "private":
      return "private";
    case "open":
      return "public";
    case "restricted":
      return null;
    default:
      return "private";
  }
}

export function mapDbVisibilityToApp(visibility: string | null | undefined): VisibilityMode {
  switch (visibility) {
    case "public":
      return "open";
    case "private":
    case "unlisted":
    default:
      return "private";
  }
}

export function getVisibilityLabel(visibility: VisibilityMode) {
  switch (visibility) {
    case "private":
      return "Private Link";
    case "open":
      return "Open";
    case "restricted":
      return "Restricted+";
    default:
      return "Private Link";
  }
}

export function getVisibilitySummary(visibility: VisibilityMode) {
  switch (visibility) {
    case "private":
      return "Only guests with your direct website link can access the live page.";
    case "open":
      return "Anyone with the live website link can open the page without restrictions.";
    case "restricted":
      return "Restricted access is coming soon.";
    default:
      return "Only guests with your direct website link can access the live page.";
  }
}

export function getPublishStatusState(
  isPublished: boolean,
  hasPendingChanges: boolean,
) {
  if (!isPublished) {
    return "hidden" as const;
  }

  if (hasPendingChanges) {
    return "needs_publish" as const;
  }

  return "up_to_date" as const;
}

export function buildChangeSummary({
  hasAccessPendingChanges,
  hasContentPendingChanges,
  hasSlugPendingChanges,
  isPublished,
}: {
  hasAccessPendingChanges: boolean;
  hasContentPendingChanges: boolean;
  hasSlugPendingChanges: boolean;
  isPublished: boolean;
}) {
  const pendingCount = [hasAccessPendingChanges, hasSlugPendingChanges, hasContentPendingChanges].filter(
    Boolean,
  ).length;

  if (!isPublished) {
    return "Draft ready to publish";
  }

  if (pendingCount === 0) {
    return "No pending changes.";
  }

  if (pendingCount > 1) {
    return "Changes pending";
  }

  if (hasContentPendingChanges) {
    return "Website content pending";
  }

  if (hasSlugPendingChanges) {
    return "URL change pending";
  }

  if (hasAccessPendingChanges) {
    return "Access change pending";
  }

  return "No pending changes.";
}
