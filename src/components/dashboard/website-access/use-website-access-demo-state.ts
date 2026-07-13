"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  PublishStatusState,
  VisibilityMode,
  WebsiteAccessInitialData,
} from "./website-access-types";
import {
  buildChangeSummary,
  formatWebsiteAccessDate,
  getPublishStatusState,
  getVisibilityLabel,
  mapDbVisibilityToApp,
} from "./website-access-utils";
import { appendPrivateAccessToken } from "@/lib/private-access";
import { sanitizePublicRsvpSlug, validateOptionalPublicRsvpSlug } from "@/lib/public-rsvp-slugs";
import {
  buildOfficialPublicRsvpStandaloneUrl,
  buildOfficialPublicRsvpUrl,
  buildPublicRsvpUrl,
  buildWildcardRsvpPreviewUrl,
  getPublicAppUrl,
  resolvePublicRsvpLinkSet,
} from "@/lib/public-rsvp-url";
import { emitDashboardSyncEvent, useDashboardRefresh } from "@/lib/dashboard/dashboard-sync";
import { dashboardKeys } from "@/lib/dashboard/dashboard-query-keys";
import { useEventWebsiteDraftSavePending } from "@/lib/event-website/draft-save-coordination";
import {
  publishEventWebsiteAction,
  regeneratePrivateLinkAction,
  unpublishEventWebsiteAction,
  updateWebsiteAccessDraftSubdomainAction,
  updateWebsiteAccessDraftVisibilityAction,
} from "@/server/actions/website-access";

function resolveLiveWebsiteLinks(state: WebsiteAccessInitialData) {
  const publishedSlug = state.publishedSlug?.trim() || null;

  if (state.publishState !== "published" || !publishedSlug) {
    return {
      copyPublicUrl: null,
      fallbackPublicUrl: null,
      fallbackRsvpPublicUrl: null,
      openPublicUrl: null,
      productionPublicUrl: null,
      publicRsvpUrl: null,
      publicUrl: null,
      qrPublicUrl: null,
      rsvpQrPublicUrl: null,
    };
  }

  const linkSet = resolvePublicRsvpLinkSet({
    baseUrl: state.publicBaseUrl,
    slug: publishedSlug,
    subdomain: state.subdomainFieldsInstalled ? state.publishedSubdomain : null,
    wildcardBaseDomain: state.wildcardBaseDomain,
  });
  const fallbackPublicUrl = linkSet.fallbackPathUrl ?? buildOfficialPublicRsvpUrl(publishedSlug);
  const fallbackRsvpPublicUrl =
    linkSet.preferredProductionRsvpUrl ?? buildOfficialPublicRsvpStandaloneUrl(publishedSlug);
  const publicUrl = linkSet.preferredProductionUrl ?? null;
  const publicRsvpUrl = state.customWebsiteConnected
    ? (linkSet.wildcardProductionRsvpUrl ?? fallbackRsvpPublicUrl)
    : fallbackRsvpPublicUrl;

  return {
    copyPublicUrl: publicUrl,
    fallbackPublicUrl,
    fallbackRsvpPublicUrl,
    openPublicUrl: publicUrl,
    productionPublicUrl: publicUrl,
    publicRsvpUrl,
    publicUrl,
    qrPublicUrl: publicUrl ?? fallbackPublicUrl,
    rsvpQrPublicUrl: publicRsvpUrl ?? fallbackRsvpPublicUrl,
  };
}

export function useWebsiteAccessState(initialData: WebsiteAccessInitialData) {
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const [serverState, setServerState] = useState(initialData);
  const isDraftSavePending = useEventWebsiteDraftSavePending(serverState.eventId);
  const [draftVisibility, setDraftVisibility] = useState<VisibilityMode>(
    initialData.draftVisibility,
  );
  const [draftSubdomain, setDraftSubdomain] = useState(initialData.draftSubdomain ?? "");
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [slugModalOpen, setSlugModalOpen] = useState(false);
  const [slugModalValue, setSlugModalValue] = useState(initialData.draftSubdomain ?? "");
  const persistedDraftSubdomainRef = useRef(initialData.draftSubdomain ?? "");

  const publicBaseUrl = useMemo(
    () => getPublicAppUrl({ baseUrl: serverState.publicBaseUrl }),
    [serverState.publicBaseUrl],
  );
  const liveWebsiteLinks = useMemo(() => resolveLiveWebsiteLinks(serverState), [serverState]);
  const subdomainDraftError = useMemo(
    () => validateOptionalPublicRsvpSlug(draftSubdomain),
    [draftSubdomain],
  );
  const slugModalSanitized = useMemo(
    () => sanitizePublicRsvpSlug(slugModalValue),
    [slugModalValue],
  );
  const slugModalError = useMemo(
    () => validateOptionalPublicRsvpSlug(slugModalSanitized),
    [slugModalSanitized],
  );
  const publishedSlug = serverState.publishedSlug ?? "";
  const publishedSubdomain = serverState.publishedSubdomain ?? "";
  const isPublished = serverState.publishState === "published";
  const hasEverPublished = serverState.hasEverPublished;
  const isSubdomainLocked = hasEverPublished;
  const publishedVisibility = serverState.publishedVisibility;
  const hasSlugChange = serverState.hasSlugPendingChanges;
  const hasSubdomainChange = draftSubdomain !== (serverState.publishedSubdomain ?? "");
  const hasVisibilityDraft = draftVisibility !== publishedVisibility;
  const hasContentPendingChanges = serverState.hasContentPendingChanges;
  const hasPendingChanges =
    hasVisibilityDraft || hasSlugChange || hasSubdomainChange || hasContentPendingChanges;
  const publishStatusState = getPublishStatusState(isPublished, hasPendingChanges);
  const activePrivateAccessToken =
    isPublished && publishedVisibility === "private" ? serverState.privateAccessToken : null;
  const isPrivateLinkReady = publishedVisibility !== "private" || Boolean(activePrivateAccessToken);
  const websiteUrlOpen = isPrivateLinkReady
    ? (appendPrivateAccessToken(
        liveWebsiteLinks.openPublicUrl ?? liveWebsiteLinks.publicUrl ?? "",
        activePrivateAccessToken,
      ) ?? "")
    : "";
  const websiteUrlPublished = isPrivateLinkReady
    ? (appendPrivateAccessToken(liveWebsiteLinks.publicUrl ?? "", activePrivateAccessToken) ?? "")
    : "";
  const websiteUrlCopy = isPrivateLinkReady
    ? (appendPrivateAccessToken(
        liveWebsiteLinks.copyPublicUrl ?? websiteUrlPublished,
        activePrivateAccessToken,
      ) ?? "")
    : "";
  const websiteUrlProduction = isPrivateLinkReady
    ? (appendPrivateAccessToken(
        liveWebsiteLinks.productionPublicUrl ?? "",
        activePrivateAccessToken,
      ) ?? "")
    : "";
  const websiteUrlQr = isPrivateLinkReady
    ? (appendPrivateAccessToken(
        liveWebsiteLinks.qrPublicUrl ??
          websiteUrlPublished ??
          liveWebsiteLinks.fallbackPublicUrl ??
          "",
        activePrivateAccessToken,
      ) ?? "")
    : "";
  const rsvpUrlQr = isPrivateLinkReady
    ? (appendPrivateAccessToken(
        liveWebsiteLinks.rsvpQrPublicUrl ??
          liveWebsiteLinks.publicRsvpUrl ??
          liveWebsiteLinks.fallbackRsvpPublicUrl ??
          "",
        activePrivateAccessToken,
      ) ?? "")
    : "";
  const websiteUrlFallback = isPrivateLinkReady
    ? (appendPrivateAccessToken(
        liveWebsiteLinks.fallbackPublicUrl ?? "",
        activePrivateAccessToken,
      ) ?? "")
    : "";
  const websiteUrlDraft = draftSubdomain
    ? (buildWildcardRsvpPreviewUrl({
        baseDomain: serverState.wildcardBaseDomain,
        subdomain: draftSubdomain,
      }) ?? "")
    : serverState.draftSlug && publicBaseUrl
      ? (buildPublicRsvpUrl({ baseUrl: publicBaseUrl, slug: serverState.draftSlug }) ?? "")
      : "";
  const changesSummary = buildChangeSummary({
    hasAccessPendingChanges: hasVisibilityDraft,
    hasContentPendingChanges,
    hasSlugPendingChanges: hasSlugChange,
    hasSubdomainPendingChanges: hasSubdomainChange,
    isPublished,
  });
  const visibilityLabel = getVisibilityLabel(draftVisibility);
  const canShareLiveUrl = Boolean(websiteUrlCopy);
  const isPublishBlocked = isPending || isDraftSavePending;

  useDashboardRefresh({
    eventId: serverState.eventId,
    events: [
      "event-website:draft-updated",
      "event-website:published",
      "event-website:unpublished",
      "website-access:private-link-regenerated",
    ],
    ignoreSelfEvents: true,
    refreshOnFocus: true,
    refreshOnVisibility: true,
  });

  useEffect(() => {
    persistedDraftSubdomainRef.current = initialData.draftSubdomain ?? "";
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      setServerState(initialData);
      setDraftVisibility(initialData.draftVisibility);
      setDraftSubdomain(initialData.draftSubdomain ?? "");

      if (!slugModalOpen) {
        setSlugModalValue(initialData.draftSubdomain ?? "");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [initialData, slugModalOpen]);

  useEffect(() => {
    if (isSubdomainLocked || !serverState.eventId) {
      return;
    }

    if (subdomainDraftError || draftSubdomain === persistedDraftSubdomainRef.current) {
      return;
    }

    const nextDraftSubdomain = draftSubdomain;
    const timeoutId = window.setTimeout(() => {
      startTransition(async () => {
        const result = await updateWebsiteAccessDraftSubdomainAction({
          eventId: serverState.eventId,
          subdomain: nextDraftSubdomain,
        });

        if (!result.ok) {
          toast.error(result.error);
          setDraftSubdomain(persistedDraftSubdomainRef.current);
          return;
        }

        persistedDraftSubdomainRef.current = result.data.draftSubdomain ?? "";
        setDraftSubdomain(result.data.draftSubdomain ?? "");
        setServerState((current) => ({
          ...current,
          draftSubdomain: result.data.draftSubdomain ?? null,
          lastEditedAt: result.data.updatedAt ?? current.lastEditedAt,
          websiteAccessUpdatedAt: result.data.updatedAt ?? current.websiteAccessUpdatedAt,
        }));
      });
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [
    draftSubdomain,
    isSubdomainLocked,
    serverState.eventId,
    startTransition,
    subdomainDraftError,
  ]);

  function updateLocalTimestamp(updatedAt: string | null) {
    setServerState((current) => ({
      ...current,
      lastEditedAt: updatedAt ?? current.lastEditedAt,
      websiteAccessUpdatedAt: updatedAt ?? current.websiteAccessUpdatedAt,
    }));
  }

  function handleVisibilitySelect(nextVisibility: VisibilityMode) {
    if (nextVisibility === "restricted") {
      toast("Restricted access is coming soon.");
      return;
    }

    if (!serverState.eventId || nextVisibility === draftVisibility) {
      return;
    }

    const previousVisibility = draftVisibility;
    setDraftVisibility(nextVisibility);

    startTransition(async () => {
      const result = await updateWebsiteAccessDraftVisibilityAction({
        eventId: serverState.eventId,
        visibility: nextVisibility,
      });

      if (!result.ok) {
        setDraftVisibility(previousVisibility);
        toast.error(result.error);
        return;
      }

      updateLocalTimestamp(result.data.updatedAt);
      setServerState((current) => ({
        ...current,
        draftVisibility: result.data.draftVisibility,
      }));
      invalidateWebsiteAccessQueries(queryClient);
      toast.success("Guest access draft saved.");
    });
  }

  function handleDraftSlugInput(value: string) {
    setDraftSubdomain(sanitizePublicRsvpSlug(value));
  }

  function openSlugModal() {
    setSlugModalValue(draftSubdomain);
    setSlugModalOpen(true);
  }

  function closeSlugModal() {
    setSlugModalOpen(false);
    setSlugModalValue(draftSubdomain);
  }

  function confirmSlugChange() {
    if (!serverState.eventId || slugModalError) {
      return;
    }

    if (slugModalSanitized === persistedDraftSubdomainRef.current) {
      setSlugModalOpen(false);
      return;
    }

    startTransition(async () => {
      const result = await updateWebsiteAccessDraftSubdomainAction({
        eventId: serverState.eventId,
        subdomain: slugModalSanitized,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      persistedDraftSubdomainRef.current = result.data.draftSubdomain ?? "";
      setDraftSubdomain(result.data.draftSubdomain ?? "");
      updateLocalTimestamp(result.data.updatedAt);
      setServerState((current) => ({
        ...current,
        draftSubdomain: result.data.draftSubdomain ?? null,
      }));
      invalidateWebsiteAccessQueries(queryClient);
      setSlugModalOpen(false);
      toast.success("Subdomain change added. Publish to apply.");
    });
  }

  function publishLatestChanges() {
    if (!serverState.eventId) {
      toast.error("The current event could not be resolved.");
      return;
    }

    if (isDraftSavePending) {
      toast.error("Please wait for the Event Website draft save to finish before publishing.");
      return;
    }

    startTransition(async () => {
      const result = await publishEventWebsiteAction({
        eventId: serverState.eventId,
        expectedSavedRevision: serverState.savedRevision,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(isPublished ? "Latest website changes published." : "Website published.");
      const publishedVisibility = mapDbVisibilityToApp(result.data.publishedVisibility);
      persistedDraftSubdomainRef.current = result.data.publishedSubdomain ?? "";
      setDraftVisibility(publishedVisibility);
      setDraftSubdomain(result.data.publishedSubdomain ?? "");
      setServerState((current) => ({
        ...current,
        draftSubdomain: result.data.publishedSubdomain,
        draftVisibility: publishedVisibility,
        hasAccessPendingChanges: false,
        hasContentPendingChanges: false,
        hasEverPublished: true,
        hasPendingChanges: false,
        hasSlugPendingChanges: false,
        hasSubdomainPendingChanges: false,
        lastEditedAt: result.data.publishedAt,
        privateAccessToken: result.data.privateAccessToken,
        publishState: "published",
        publishedAt: result.data.publishedAt,
        publishedRevision: result.data.publishedRevision,
        publishedSlug: result.data.publishedSlug,
        publishedSubdomain: result.data.publishedSubdomain,
        publishedVisibility,
        snapshotPublishedAt: result.data.publishedAt,
        websiteAccessUpdatedAt: result.data.publishedAt,
      }));
      emitDashboardSyncEvent({
        eventId: serverState.eventId,
        name: "event-website:published",
      });
      invalidateWebsiteAccessQueries(queryClient);
    });
  }

  function publishWebsite() {
    publishLatestChanges();
  }

  function unpublishWebsite() {
    if (!serverState.eventId) {
      toast.error("The current event could not be resolved.");
      return;
    }

    startTransition(async () => {
      const result = await unpublishEventWebsiteAction({
        eventId: serverState.eventId,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Website hidden from guests.");
      setServerState((current) => ({
        ...current,
        hasAccessPendingChanges: false,
        hasContentPendingChanges: false,
        hasPendingChanges: false,
        hasSlugPendingChanges: false,
        hasSubdomainPendingChanges: false,
        lastEditedAt: current.websiteAccessUpdatedAt ?? current.lastEditedAt,
        publishState: "unpublished",
        publishedAt: null,
        snapshotPublishedAt: null,
      }));
      emitDashboardSyncEvent({
        eventId: serverState.eventId,
        name: "event-website:unpublished",
      });
      invalidateWebsiteAccessQueries(queryClient);
    });
  }

  function openRegeneratePrivateLinkDialog() {
    setIsRegenerateDialogOpen(true);
  }

  function closeRegeneratePrivateLinkDialog() {
    setIsRegenerateDialogOpen(false);
  }

  function regeneratePrivateLink() {
    if (!serverState.eventId) {
      toast.error("The current event could not be resolved.");
      return;
    }

    startTransition(async () => {
      const result = await regeneratePrivateLinkAction({
        eventId: serverState.eventId,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setServerState((current) => ({
        ...current,
        lastEditedAt: result.data.updatedAt ?? current.lastEditedAt,
        privateAccessToken: result.data.privateAccessToken,
        websiteAccessUpdatedAt: result.data.updatedAt ?? current.websiteAccessUpdatedAt,
      }));
      setIsRegenerateDialogOpen(false);
      toast.success("Private link regenerated.", {
        description: "Old private links will no longer work.",
      });
      emitDashboardSyncEvent({
        eventId: serverState.eventId,
        name: "website-access:private-link-regenerated",
      });
      invalidateWebsiteAccessQueries(queryClient);
    });
  }

  async function copyText(value: string, successMessage: string) {
    if (!value) {
      toast.error("There is no live website URL to share yet.");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error("Could not copy the link.");
    }
  }

  function requireLiveUrl(value: string) {
    if (!canShareLiveUrl || !value) {
      toast.error("Publish the website before sharing live links or QR codes.");
      return false;
    }

    return true;
  }

  return {
    changesSummary,
    closeSlugModal,
    confirmSlugChange,
    copyWebsiteLink: () => {
      if (!requireLiveUrl(websiteUrlCopy)) {
        return;
      }

      void copyText(websiteUrlCopy, "Website link copied");
    },
    copyWebsiteQrLink: () => {
      if (!requireLiveUrl(websiteUrlQr)) {
        return;
      }

      void copyText(websiteUrlQr, "Website QR link copied");
    },
    copyRsvpQrLink: () => {
      if (!requireLiveUrl(rsvpUrlQr)) {
        return;
      }

      void copyText(rsvpUrlQr, "RSVP QR link copied");
    },
    customWebsiteConnected: serverState.customWebsiteConnected,
    handleDraftSlugInput,
    handleVisibilitySelect,
    hasEverPublished,
    hasPendingChanges,
    hasSlugChange,
    hasVisibilityDraft,
    isPrivateLinkRegenerateAvailable: isPublished && publishedVisibility === "private",
    isDraftSavePending,
    isInteractionPending: isPending,
    isPublishBlocked,
    isPublished,
    isRegenerateDialogOpen,
    isSlugLocked: isSubdomainLocked,
    lastEditedAt: parseIsoDate(serverState.lastEditedAt ?? serverState.websiteAccessUpdatedAt),
    lastEditedLabel: formatWebsiteAccessDate(
      parseIsoDate(serverState.lastEditedAt ?? serverState.websiteAccessUpdatedAt),
    ),
    openSlugModal,
    publishLatestChanges,
    publishStatusState: publishStatusState as PublishStatusState,
    publishWebsite,
    publishedAt: parseIsoDate(serverState.publishedAt),
    publishedAtLabel: formatWebsiteAccessDate(parseIsoDate(serverState.publishedAt)),
    publishedSubdomain,
    publishedVisibility,
    qrActionsEnabled: canShareLiveUrl,
    regeneratePrivateLink,
    closeRegeneratePrivateLinkDialog,
    openRegeneratePrivateLinkDialog,
    setSlugModalValue,
    slugDraft: draftSubdomain,
    slugDraftError: subdomainDraftError,
    slugModalError,
    slugModalOpen,
    slugModalSanitized,
    slugModalValue,
    slugPublished: publishedSlug,
    subdomainBaseDomain: serverState.wildcardBaseDomain,
    subdomainConfigured: serverState.wildcardDomainConfigured,
    unpublishWebsite,
    visibility: draftVisibility,
    visibilityLabel,
    websiteUrlOpen,
    websiteUrlDraft,
    websiteUrlFallback,
    websiteUrlCopy,
    websiteUrlPublished,
    websiteUrlProduction,
    websiteUrlQr,
    rsvpUrlQr,
  };
}

function invalidateWebsiteAccessQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.websiteAccess() });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.home() });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.event() });
}

function parseIsoDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
