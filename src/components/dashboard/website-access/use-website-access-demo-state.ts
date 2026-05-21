"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  PublishStatusState,
  VisibilityMode,
  WebsiteAccessInitialData,
} from "./website-access-types";
import {
  buildChangeSummary,
  buildShareUrl,
  formatWebsiteAccessDate,
  getPublishStatusState,
  getVisibilityLabel,
  sanitizeSlug,
  validateSlug,
} from "./website-access-utils";
import {
  publishEventWebsiteAction,
  unpublishEventWebsiteAction,
  updateWebsiteAccessDraftSlugAction,
  updateWebsiteAccessDraftVisibilityAction,
} from "@/server/actions/website-access";

const DEFAULT_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || "https://webserbisyo.com";

export function useWebsiteAccessState(initialData: WebsiteAccessInitialData) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverState, setServerState] = useState(initialData);
  const [draftVisibility, setDraftVisibility] = useState<VisibilityMode>(initialData.draftVisibility);
  const [draftSlug, setDraftSlug] = useState(initialData.draftSlug ?? initialData.publishedSlug ?? "");
  const [slugModalOpen, setSlugModalOpen] = useState(false);
  const [slugModalValue, setSlugModalValue] = useState(initialData.draftSlug ?? initialData.publishedSlug ?? "");
  const persistedDraftSlugRef = useRef(initialData.draftSlug ?? initialData.publishedSlug ?? "");

  const origin = useSyncExternalStore(
    () => () => undefined,
    () => window.location.origin,
    () => DEFAULT_ORIGIN,
  );
  const slugDraftError = useMemo(() => validateSlug(draftSlug), [draftSlug]);
  const slugModalSanitized = useMemo(() => sanitizeSlug(slugModalValue), [slugModalValue]);
  const slugModalError = useMemo(() => validateSlug(slugModalSanitized), [slugModalSanitized]);
  const publishedSlug = serverState.publishedSlug ?? "";
  const isPublished = serverState.publishState === "published";
  const hasEverPublished = serverState.hasEverPublished;
  const isSlugLocked = hasEverPublished;
  const publishedVisibility = serverState.publishedVisibility;
  const hasSlugChange = Boolean(draftSlug && draftSlug !== publishedSlug);
  const hasVisibilityDraft = draftVisibility !== publishedVisibility;
  const hasContentPendingChanges = serverState.hasContentPendingChanges;
  const hasPendingChanges = hasVisibilityDraft || hasSlugChange || hasContentPendingChanges;
  const publishStatusState = getPublishStatusState(isPublished, hasPendingChanges);
  const websiteUrlPublished = publishedSlug ? buildShareUrl(origin, publishedSlug) : "";
  const websiteUrlDraft = draftSlug ? buildShareUrl(origin, draftSlug) : "";
  const rsvpUrlPublished = publishedSlug ? buildShareUrl(origin, publishedSlug, "rsvp-form") : "";
  const changesSummary = buildChangeSummary({
    hasAccessPendingChanges: hasVisibilityDraft,
    hasContentPendingChanges,
    hasSlugPendingChanges: hasSlugChange,
    isPublished,
  });
  const visibilityLabel = getVisibilityLabel(draftVisibility);
  const canShareLiveUrl = isPublished && Boolean(publishedSlug);

  useEffect(() => {
    if (isSlugLocked || !serverState.eventId) {
      return;
    }

    if (slugDraftError || draftSlug === persistedDraftSlugRef.current) {
      return;
    }

    const nextDraftSlug = draftSlug;
    const timeoutId = window.setTimeout(() => {
      startTransition(async () => {
        const result = await updateWebsiteAccessDraftSlugAction({
          eventId: serverState.eventId,
          slug: nextDraftSlug,
        });

        if (!result.ok) {
          toast.error(result.error);
          setDraftSlug(persistedDraftSlugRef.current);
          return;
        }

        persistedDraftSlugRef.current = result.data.draftSlug;
        setDraftSlug(result.data.draftSlug);
        setServerState((current) => ({
          ...current,
          draftSlug: result.data.draftSlug,
          lastEditedAt: result.data.updatedAt ?? current.lastEditedAt,
          websiteAccessUpdatedAt: result.data.updatedAt ?? current.websiteAccessUpdatedAt,
        }));
      });
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [draftSlug, isSlugLocked, serverState.eventId, slugDraftError, startTransition]);

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
    setDraftSlug(sanitizeSlug(value));
  }

  function openSlugModal() {
    setSlugModalValue(draftSlug);
    setSlugModalOpen(true);
  }

  function closeSlugModal() {
    setSlugModalOpen(false);
    setSlugModalValue(draftSlug);
  }

  function confirmSlugChange() {
    if (!serverState.eventId || slugModalError) {
      return;
    }

    if (slugModalSanitized === persistedDraftSlugRef.current) {
      setSlugModalOpen(false);
      return;
    }

    startTransition(async () => {
      const result = await updateWebsiteAccessDraftSlugAction({
        eventId: serverState.eventId,
        slug: slugModalSanitized,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      persistedDraftSlugRef.current = result.data.draftSlug;
      setDraftSlug(result.data.draftSlug);
      updateLocalTimestamp(result.data.updatedAt);
      setServerState((current) => ({
        ...current,
        draftSlug: result.data.draftSlug,
      }));
      setSlugModalOpen(false);
      toast.success("URL change added. Publish to apply.");
    });
  }

  function publishLatestChanges() {
    if (!serverState.eventId) {
      toast.error("The current event could not be resolved.");
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
      if (!requireLiveUrl(rsvpUrlPublished)) {
        return;
      }

      void copyText(rsvpUrlPublished, "RSVP form link copied");
    },
    copyWebsiteLink: () => {
      if (!requireLiveUrl(websiteUrlPublished)) {
        return;
      }

      void copyText(websiteUrlPublished, "Website link copied");
    },
    copyWebsiteQrLink: () => {
      if (!requireLiveUrl(websiteUrlPublished)) {
        return;
      }

      void copyText(websiteUrlPublished, "Website QR link copied");
    },
    handleDraftSlugInput,
    handleVisibilitySelect,
    hasEverPublished,
    hasPendingChanges,
    hasSlugChange,
    hasVisibilityDraft,
    isInteractionPending: isPending,
    isPublished,
    isSlugLocked,
    lastEditedAt: parseIsoDate(serverState.lastEditedAt ?? serverState.websiteAccessUpdatedAt),
    lastEditedLabel: formatWebsiteAccessDate(
      parseIsoDate(serverState.lastEditedAt ?? serverState.websiteAccessUpdatedAt),
    ),
    openSlugModal,
    origin,
    publishLatestChanges,
    publishStatusState: publishStatusState as PublishStatusState,
    publishWebsite,
    publishedAt: parseIsoDate(serverState.publishedAt),
    publishedAtLabel: formatWebsiteAccessDate(parseIsoDate(serverState.publishedAt)),
    publishedVisibility: publishedVisibility,
    qrActionsEnabled: canShareLiveUrl,
    rsvpUrlPublished,
    setSlugModalValue,
    slugDraft: draftSlug,
    slugDraftError,
    slugModalError,
    slugModalOpen,
    slugModalSanitized,
    slugModalValue,
    slugPublished: publishedSlug,
    unpublishWebsite,
    visibility: draftVisibility,
    visibilityLabel,
    websiteUrlDraft,
    websiteUrlPublished,
  };
}

function parseIsoDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
