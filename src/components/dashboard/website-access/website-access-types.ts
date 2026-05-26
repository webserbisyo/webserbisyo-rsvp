export type VisibilityMode = "private" | "open" | "restricted";
export type DbVisibilityMode = "private" | "public" | "unlisted";
export type PublishState = "published" | "unpublished";
export type PublishStatusState = "up_to_date" | "needs_publish" | "hidden";

export type VisibilityOption = {
  description: string;
  disabled?: boolean;
  id: VisibilityMode;
  label: string;
  note?: string;
};

export type WebsiteAccessInitialData = {
  canDownloadQr: boolean;
  canOpenWebsite: boolean;
  changesSummary: string;
  contentDraftSavedAt: string | null;
  draftSlug: string | null;
  draftSubdomain: string | null;
  draftVisibility: VisibilityMode;
  eventId: string | null;
  fallbackPublicUrl: string | null;
  fallbackRsvpUrl: string | null;
  hasAccessPendingChanges: boolean;
  hasContentPendingChanges: boolean;
  hasEverPublished: boolean;
  hasPendingChanges: boolean;
  hasSlugPendingChanges: boolean;
  hasSubdomainPendingChanges: boolean;
  lastEditedAt: string | null;
  openPublicUrl: string | null;
  publicBaseUrl: string | null;
  publicUrl: string | null;
  publishState: PublishState;
  publishedAt: string | null;
  publishedSlug: string | null;
  publishedSubdomain: string | null;
  publishedVisibility: VisibilityMode;
  productionPublicUrl: string | null;
  rsvpUrl: string | null;
  snapshotPublishedAt: string | null;
  subdomainFieldsInstalled: boolean;
  wildcardBaseDomain: string;
  wildcardDomainConfigured: boolean;
  websiteAccessUpdatedAt: string | null;
};
