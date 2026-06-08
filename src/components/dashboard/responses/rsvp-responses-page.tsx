"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/feedback/error-state";
import {
  emitDashboardSyncEvent,
  useDashboardRefresh,
} from "@/lib/dashboard/dashboard-sync";
import {
  removeResponseMessagesFromGuestbookAction,
  showResponseMessagesInGuestbookAction,
} from "@/server/actions/responses";
import { RsvpResponseDetailDialog } from "./rsvp-response-detail-dialog";
import { RsvpResponseExportDialog } from "./rsvp-response-export-dialog";
import { RsvpResponsesEmptyState } from "./rsvp-responses-empty-state";
import { RsvpResponsesStats } from "./rsvp-responses-stats";
import { RsvpResponsesTable } from "./rsvp-responses-table";
import {
  matchesResponseSearch,
  matchesResponseTab,
  type RsvpResponseRecord,
  type RsvpResponsesTab,
} from "./rsvp-responses-types";

type RsvpResponsesPageProps = {
  errorMessage?: string | null;
  eventSlug?: string | null;
  eventTitle?: string | null;
  hasCurrentEvent: boolean;
  initialActiveTab?: RsvpResponsesTab;
  initialResponses: RsvpResponseRecord[];
};

export function RsvpResponsesPage({
  errorMessage = null,
  eventSlug = null,
  eventTitle = null,
  hasCurrentEvent,
  initialActiveTab = "all",
  initialResponses,
}: RsvpResponsesPageProps) {
  const [responses, setResponses] = useState(initialResponses);
  const [prevInitialResponses, setPrevInitialResponses] = useState(initialResponses);
  const [activeTab, setActiveTab] = useState<RsvpResponsesTab>(initialActiveTab);
  const [searchQuery, setSearchQuery] = useState("");

  if (initialResponses !== prevInitialResponses) {
    setPrevInitialResponses(initialResponses);
    setResponses(initialResponses);
  }
  const [selectedResponse, setSelectedResponse] = useState<RsvpResponseRecord | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [pendingResponseIds, setPendingResponseIds] = useState<string[]>([]);
  const [isModerating, startModerationTransition] = useTransition();

  useDashboardRefresh({
    events: ["rsvp-responses:guestbook-updated"],
    refreshOnFocus: true,
    refreshOnVisibility: true,
  });

  const allResponses = responses;
  const scopedResponses = allResponses.filter((response) => matchesResponseTab(response, activeTab));
  const currentViewResponses = scopedResponses.filter((response) =>
    matchesResponseSearch(response, searchQuery),
  );
  const currentViewCount = currentViewResponses.length;

  const totalResponses = allResponses.length;
  const attendingCount = allResponses.filter((response) => response.status === "attending").length;
  const notAttendingCount = allResponses.filter(
    (response) => response.status === "not_attending",
  ).length;
  const totalPartySize = allResponses.reduce((total, response) => total + response.partySize, 0);
  const canRenderResponses = !errorMessage && hasCurrentEvent;

  return (
    <div className="space-y-6 pt-6 pb-24 md:pb-8">
      {errorMessage ? (
        <ErrorState title="RSVP responses could not be loaded" description={errorMessage} />
      ) : !hasCurrentEvent ? (
        <RsvpResponsesEmptyState variant="no-event" />
      ) : (
        <>
          <RsvpResponsesStats
            attendingCount={attendingCount}
            notAttendingCount={notAttendingCount}
            totalPartySize={totalPartySize}
            totalResponses={totalResponses}
          />

          <RsvpResponsesTable
            activeTab={activeTab}
            hasResponses={allResponses.length > 0}
            onActiveTabChange={setActiveTab}
            isModerating={isModerating}
            onExportClick={() => setIsExportOpen(true)}
            onGuestbookModeration={handleGuestbookModeration}
            onOpenResponse={setSelectedResponse}
            pendingResponseIds={pendingResponseIds}
            responses={scopedResponses}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          {canRenderResponses ? (
            <>
              <RsvpResponseDetailDialog
                open={selectedResponse !== null}
                response={selectedResponse}
                onOpenChange={(open) => {
                  if (!open) {
                    setSelectedResponse(null);
                  }
                }}
              />

              <RsvpResponseExportDialog
                allResponses={allResponses}
                allResponsesCount={totalResponses}
                currentViewResponses={currentViewResponses}
                currentViewCount={currentViewCount}
                eventSlug={eventSlug}
                eventTitle={eventTitle}
                open={isExportOpen}
                onOpenChange={setIsExportOpen}
              />
            </>
          ) : null}
        </>
      )}
    </div>
  );

  function handleGuestbookModeration(
    mode: "approve" | "remove",
    responseIds: string[],
  ) {
    const uniqueIds = Array.from(new Set(responseIds));

    if (uniqueIds.length === 0) {
      toast.error("No eligible messages selected.");
      return;
    }

    if (isModerating || pendingResponseIds.some((id) => uniqueIds.includes(id))) {
      return;
    }

    setPendingResponseIds(uniqueIds);
    startModerationTransition(async () => {
      try {
        const result =
          mode === "approve"
            ? await showResponseMessagesInGuestbookAction({ responseIds: uniqueIds })
            : await removeResponseMessagesFromGuestbookAction({ responseIds: uniqueIds });

        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        const updatedCount = result.data.updatedCount;
        const skippedNoMessageCount = result.data.skippedNoMessageCount;
        const skippedUnauthorizedCount = result.data.skippedUnauthorizedCount;
        const skippedAlreadySetCount = result.data.skippedAlreadySetCount;

        if (updatedCount > 0) {
          emitDashboardSyncEvent({
            name: "rsvp-responses:guestbook-updated",
          });
          setResponses((current) =>
            current.map((response) => {
              const next = result.data.updated.find((item) => item.id === response.id);

              if (!next) {
                return response;
              }

              return {
                ...response,
                messageApprovedAt: next.messageApprovedAt,
                messageApprovedBy: next.messageApprovedBy,
                messagePublicConsent: next.messagePublicConsent,
                messagePublicStatus: next.messagePublicStatus,
                updatedAt: next.updatedAt,
              };
            }),
          );
          setSelectedResponse((current) => {
            if (!current) {
              return current;
            }

            const next = result.data.updated.find((item) => item.id === current.id);

            return next
              ? {
                  ...current,
                  messageApprovedAt: next.messageApprovedAt,
                  messageApprovedBy: next.messageApprovedBy,
                  messagePublicConsent: next.messagePublicConsent,
                  messagePublicStatus: next.messagePublicStatus,
                  updatedAt: next.updatedAt,
                }
              : current;
          });
        }

        const successLabel =
          mode === "approve"
            ? `Added ${updatedCount} message${updatedCount === 1 ? "" : "s"} to Guestbook.`
            : `Removed ${updatedCount} message${updatedCount === 1 ? "" : "s"} from Guestbook.`;
        const skippedParts = [
          skippedNoMessageCount > 0
            ? `${skippedNoMessageCount} ${skippedNoMessageCount === 1 ? "row has" : "rows have"} no message`
            : null,
          skippedAlreadySetCount > 0
            ? `${skippedAlreadySetCount} already ${mode === "approve" ? "shown" : "private"}`
            : null,
          skippedUnauthorizedCount > 0
            ? `${skippedUnauthorizedCount} could not be verified`
            : null,
        ].filter(Boolean);

        if (updatedCount === 0) {
          toast.error(
            skippedParts.length > 0
              ? `No eligible messages selected. ${skippedParts.join("; ")}.`
              : "No eligible messages selected.",
          );
          return;
        }

        if (skippedParts.length > 0) {
          toast(successLabel, {
            description: skippedParts.join("; "),
          });
          return;
        }

        if (mode === "approve") {
          toast.success(successLabel);
          return;
        }

        toast(successLabel);
      } finally {
        setPendingResponseIds([]);
      }
    });
  }
}
