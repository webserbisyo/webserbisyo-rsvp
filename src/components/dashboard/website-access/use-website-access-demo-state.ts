"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
} from "./website-access-utils";
import { sanitizePublicRsvpSlug, validateOptionalPublicRsvpSlug } from "@/lib/public-rsvp-slugs";
import {
  buildPublicRsvpUrl,
  buildWildcardRsvpPreviewUrl,
  getPublicAppUrl,
} from "@/lib/public-rsvp-url";
import { useEventWebsiteDraftSavePending } from "@/lib/event-website/draft-save-coordination";
import {
  publishEventWebsiteAction,
  unpublishEventWebsiteAction,
  updateWebsiteAccessDraftSubdomainAction,
  updateWebsiteAccessDraftVisibilityAction,
} from "@/server/actions/website-access";

export function useWebsiteAccessState(initialData: WebsiteAccessInitialData) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverState, setServerState] = useState(initialData);
  const isDraftSavePending = useEventWebsiteDraftSavePending(serverState.eventId);
  const [draftVisibility, setDraftVisibility] = useState<VisibilityMode>(initialData.draftVisibility);
  const [draftSubdomain, setDraftSubdomain] = useState(initialData.draftSubdomain ?? "");
  const [slugModalOpen, setSlugModalOpen] = useState(false);
  const [slugModalValue, setSlugModalValue] = useState(initialData.draftSubdomain ?? "");
  const persistedDraftSubdomainRef = useRef(initialData.draftSubdomain ?? "");

  const publicBaseUrl = useMemo(
    () => getPublicAppUrl({ baseUrl: serverState.publicBaseUrl }),
    [serverState.publicBaseUrl],
  );
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
    hasVisibilityDraft ||
    hasSlugChange ||
    hasSubdomainChange ||
    hasContentPendingChanges;
  const publishStatusState = getPublishStatusState(isPublished, hasPendingChanges);
  const websiteUrlOpen = serverState.openPublicUrl ?? serverState.publicUrl ?? "";
  const websiteUrlPublished = serverState.publicUrl ?? "";
  const websiteUrlCopy = serverState.copyPublicUrl ?? websiteUrlPublished;
  const websiteUrlProduction = serverState.productionPublicUrl ?? "";
  const websiteUrlQr = serverState.qrPublicUrl ?? websiteUrlPublished;
  const websiteUrlFallback = serverState.fallbackPublicUrl ?? "";
  const websiteUrlDraft = draftSubdomain
    ? (buildWildcardRsvpPreviewUrl({
        baseDomain: serverState.wildcardBaseDomain,
        subdomain: draftSubdomain,
      }) ?? "")
    : (serverState.draftSlug && publicBaseUrl
        ? (buildPublicRsvpUrl({ baseUrl: publicBaseUrl, slug: serverState.draftSlug }) ?? "")
        : "");
  const rsvpUrlPublished = serverState.rsvpUrl ?? "";
  const rsvpUrlCopy = serverState.copyRsvpUrl ?? rsvpUrlPublished;
  const rsvpUrlQr = serverState.qrRsvpUrl ?? rsvpUrlPublished;
  const changesSummary = buildChangeSummary({
    hasAccessPendingChanges: hasVisibilityDraft,
    hasContentPendingChanges,
    hasSlugPendingChanges: hasSlugChange,
    hasSubdomainPendingChanges: hasSubdomainChange,
    isPublished,
  });
  const visibilityLabel = getVisibilityLabel(draftVisibility);
  const canShareLiveUrl = Boolean(websiteUrlCopy && rsvpUrlCopy);
  const isPublishBlocked = isPending || isDraftSavePending;

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
  }, [draftSubdomain, isSubdomainLocked, serverState.eventId, startTransition, subdomainDraftError]);

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
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(isPublished ? "Latest website changes published." : "Website published.");
      router.refresh();
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
      router.refresh();
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
    copyRsvpLink: () => {
      if (!requireLiveUrl(rsvpUrlCopy)) {
        return;
      }

      void copyText(rsvpUrlCopy, "RSVP form link copied");
    },
    copyWebsiteLink: () => {
      if (!requireLiveUrl(websiteUrlCopy)) {
        return;
      }

      void copyText(websiteUrlCopy, "Website link copied");
    },
    copyWebsiteQrLink: () => {
      if (!requireLiveUrl(websiteUrlCopy)) {
        return;
      }

      void copyText(websiteUrlCopy, "Website QR link copied");
    },
    handleDraftSlugInput,
    handleVisibilitySelect,
    hasEverPublished,
    hasPendingChanges,
    hasSlugChange,
    hasVisibilityDraft,
    isDraftSavePending,
    isInteractionPending: isPending,
    isPublishBlocked,
    isPublished,
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
    rsvpUrlCopy,
    rsvpUrlPublished,
    rsvpUrlQr,
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
  };
}

function parseIsoDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
