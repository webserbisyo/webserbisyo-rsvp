"use client";

import { useEffect, useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ErrorState } from "@/components/feedback/error-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { emitDashboardSyncEvent, useDashboardRefresh } from "@/lib/dashboard/dashboard-sync";
import { dashboardKeys } from "@/lib/dashboard/dashboard-query-keys";
import {
  confirmRsvpResponsesAction,
  moderateRsvpResponsesAction,
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
  isConfirmedGuest,
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
  const [activeTab, setActiveTab] = useState<RsvpResponsesTab>(initialActiveTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [responseToReject, setResponseToReject] = useState<string | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<RsvpResponseRecord | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [pendingResponseIds, setPendingResponseIds] = useState<string[]>([]);
  const [isModerating, startModerationTransition] = useTransition();
  const queryClient = useQueryClient();

  const [bulkRejectIds, setBulkRejectIds] = useState<string[] | null>(null);
  const [bulkRestoreIds, setBulkRestoreIds] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        setResponses(initialResponses);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [initialResponses]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        setActiveTab(initialActiveTab);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [initialActiveTab]);

  useDashboardRefresh({
    events: ["rsvp-responses:guestbook-updated", "rsvp-responses:inserted"],
    refreshOnFocus: true,
    refreshOnVisibility: true,
  });

  const allResponses = responses;
  const scopedResponses = allResponses.filter((response) =>
    matchesResponseTab(response, activeTab),
  );
  const currentViewResponses = scopedResponses.filter((response) =>
    matchesResponseSearch(response, searchQuery),
  );
  const currentViewCount = currentViewResponses.length;

  const totalResponses = allResponses.length;
  const attendingCount = allResponses.filter(
    (response) => response.status === "attending" && response.reviewStatus === "approved",
  ).length;
  const notAttendingCount = allResponses.filter(
    (response) => response.status === "not_attending" && response.reviewStatus === "approved",
  ).length;
  const totalPartySize = allResponses
    .filter((response) => response.status === "attending" && response.reviewStatus === "approved")
    .reduce((total, response) => total + response.partySize, 0);
  const confirmedResponses = allResponses.filter(isConfirmedGuest);
  const confirmedCount = confirmedResponses.length;
  const confirmedPartySize = confirmedResponses.reduce(
    (total, response) => total + response.partySize,
    0,
  );
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
            onConfirmResponses={handleConfirmResponses}
            onGuestbookModeration={handleGuestbookModeration}
            onOpenResponse={setSelectedResponse}
            onRejectResponses={handleBulkReject}
            onRestoreResponses={handleBulkRestore}
            onUnconfirmResponses={handleUnconfirmResponses}
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
                onRejectResponse={setResponseToReject}
                onRestoreResponse={handleRestoreResponse}
              />

              <RsvpResponseExportDialog
                allResponses={allResponses}
                allResponsesCount={totalResponses}
                confirmedPartySize={confirmedPartySize}
                confirmedResponses={confirmedResponses}
                confirmedResponsesCount={confirmedCount}
                currentViewResponses={currentViewResponses}
                currentViewCount={currentViewCount}
                eventSlug={eventSlug}
                eventTitle={eventTitle}
                open={isExportOpen}
                onOpenChange={setIsExportOpen}
              />

              <AlertDialog
                open={responseToReject !== null}
                onOpenChange={(open) => !open && setResponseToReject(null)}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject this RSVP?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This response will no longer count toward your attending guest total. You can
                      restore it later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-rose-600 text-white hover:bg-rose-700"
                      onClick={(e) => {
                        e.preventDefault();
                        if (responseToReject) handleRejectResponse(responseToReject);
                      }}
                    >
                      Reject RSVP
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog
                open={bulkRejectIds !== null}
                onOpenChange={(open) => !open && setBulkRejectIds(null)}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Reject{" "}
                      {bulkRejectIds?.length === 1 ? "this RSVP" : `${bulkRejectIds?.length} RSVPs`}
                      ?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      These responses will no longer count toward your attending guest total. You
                      can restore them later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-rose-600 text-white hover:bg-rose-700"
                      onClick={(e) => {
                        e.preventDefault();
                        if (bulkRejectIds) confirmBulkReject(bulkRejectIds);
                      }}
                    >
                      Reject {bulkRejectIds?.length === 1 ? "RSVP" : "RSVPs"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog
                open={bulkRestoreIds !== null}
                onOpenChange={(open) => !open && setBulkRestoreIds(null)}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Restore{" "}
                      {bulkRestoreIds?.length === 1
                        ? "this RSVP"
                        : `${bulkRestoreIds?.length} RSVPs`}
                      ?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      These responses will count toward your attending guest total again if your
                      guest limit allows.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        if (bulkRestoreIds) confirmBulkRestore(bulkRestoreIds);
                      }}
                    >
                      Restore {bulkRestoreIds?.length === 1 ? "RSVP" : "RSVPs"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}
        </>
      )}
    </div>
  );

  function handleBulkReject(responseIds: string[]) {
    setBulkRejectIds(responseIds);
  }

  function handleBulkRestore(responseIds: string[]) {
    setBulkRestoreIds(responseIds);
  }

  function handleConfirmResponses(responseIds: string[]) {
    updateConfirmation("confirm", responseIds);
  }

  function handleUnconfirmResponses(responseIds: string[]) {
    updateConfirmation("unconfirm", responseIds);
  }

  function updateConfirmation(mode: "confirm" | "unconfirm", responseIds: string[]) {
    const uniqueIds = Array.from(new Set(responseIds));
    if (
      uniqueIds.length === 0 ||
      isModerating ||
      pendingResponseIds.some((id) => uniqueIds.includes(id))
    ) {
      return;
    }

    const snapshot = responses;
    const now = new Date().toISOString();
    setPendingResponseIds((current) => [...current, ...uniqueIds]);
    setResponses((current) =>
      current.map((response) => {
        if (!uniqueIds.includes(response.id)) return response;
        return mode === "confirm"
          ? { ...response, hostConfirmationStatus: "confirmed", hostConfirmedAt: now }
          : {
              ...response,
              hostConfirmationStatus: "pending",
              hostConfirmedAt: null,
              hostConfirmedBy: null,
            };
      }),
    );

    startModerationTransition(async () => {
      try {
        const result = await confirmRsvpResponsesAction({ mode, responseIds: uniqueIds });
        if (!result.ok) {
          setResponses(snapshot);
          toast.error(result.error);
          return;
        }

        setResponses((current) =>
          current.map((response) => {
            const updated = result.data.updated.find((item) => item.id === response.id);
            return updated
              ? {
                  ...response,
                  hostConfirmationStatus: updated.hostConfirmationStatus,
                  hostConfirmedAt: updated.hostConfirmedAt,
                  hostConfirmedBy: updated.hostConfirmedBy,
                  updatedAt: updated.updatedAt,
                }
              : response;
          }),
        );
        setSelectedResponse((current) => {
          const updated = current && result.data.updated.find((item) => item.id === current.id);
          return current && updated
            ? {
                ...current,
                hostConfirmationStatus: updated.hostConfirmationStatus,
                hostConfirmedAt: updated.hostConfirmedAt,
                hostConfirmedBy: updated.hostConfirmedBy,
                updatedAt: updated.updatedAt,
              }
            : current;
        });
        toast.success(
          mode === "confirm"
            ? `Confirmed ${result.data.updatedCount} guest${result.data.updatedCount === 1 ? "" : "s"}.`
            : `Unconfirmed ${result.data.updatedCount} guest${result.data.updatedCount === 1 ? "" : "s"}.`,
        );
        invalidateResponseQueries(queryClient);
      } finally {
        setPendingResponseIds((current) => current.filter((id) => !uniqueIds.includes(id)));
      }
    });
  }

  function confirmBulkReject(responseIds: string[]) {
    const uniqueIds = Array.from(new Set(responseIds));
    if (
      uniqueIds.length === 0 ||
      isModerating ||
      pendingResponseIds.some((id) => uniqueIds.includes(id))
    )
      return;

    setBulkRejectIds(null);
    setPendingResponseIds((prev) => [...prev, ...uniqueIds]);

    startModerationTransition(async () => {
      try {
        const result = await moderateRsvpResponsesAction({
          mode: "reject",
          responseIds: uniqueIds,
        });

        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        toast.success(`Rejected ${result.data.count} RSVP${result.data.count === 1 ? "" : "s"}.`);
        setResponses((current) =>
          current.map((r) =>
            uniqueIds.includes(r.id)
              ? {
                  ...r,
                  hostConfirmationStatus: "pending",
                  hostConfirmedAt: null,
                  hostConfirmedBy: null,
                  reviewStatus: "rejected",
                }
              : r,
          ),
        );
        setSelectedResponse((current) =>
          current && uniqueIds.includes(current.id)
            ? {
                ...current,
                hostConfirmationStatus: "pending",
                hostConfirmedAt: null,
                hostConfirmedBy: null,
                reviewStatus: "rejected",
              }
            : current,
        );
        invalidateResponseQueries(queryClient);
      } finally {
        setPendingResponseIds((prev) => prev.filter((id) => !uniqueIds.includes(id)));
      }
    });
  }

  function confirmBulkRestore(responseIds: string[]) {
    const uniqueIds = Array.from(new Set(responseIds));
    if (
      uniqueIds.length === 0 ||
      isModerating ||
      pendingResponseIds.some((id) => uniqueIds.includes(id))
    )
      return;

    setBulkRestoreIds(null);
    setPendingResponseIds((prev) => [...prev, ...uniqueIds]);

    startModerationTransition(async () => {
      try {
        const result = await moderateRsvpResponsesAction({
          mode: "approve",
          responseIds: uniqueIds,
        });

        if (!result.ok) {
          if (result.error.includes("CAPACITY_EXCEEDED")) {
            toast.error(
              uniqueIds.length === 1
                ? "Cannot restore RSVP. Guest limit reached for this event."
                : "Cannot restore selected RSVPs. Guest limit reached for this event.",
            );
          } else {
            toast.error(result.error);
          }
          // Note: If partial success happened before capacity was reached,
          // the server action currently fails the whole batch or throws on the first failure.
          // For launch, we just report the error and let the next page refresh show true state,
          // or we assume it failed completely.
          return;
        }

        toast.success(`Restored ${result.data.count} RSVP${result.data.count === 1 ? "" : "s"}.`);
        setResponses((current) =>
          current.map((r) => (uniqueIds.includes(r.id) ? { ...r, reviewStatus: "approved" } : r)),
        );
        setSelectedResponse((current) =>
          current && uniqueIds.includes(current.id)
            ? { ...current, reviewStatus: "approved" }
            : current,
        );
        invalidateResponseQueries(queryClient);
      } finally {
        setPendingResponseIds((prev) => prev.filter((id) => !uniqueIds.includes(id)));
      }
    });
  }

  function handleRejectResponse(responseId: string) {
    if (isModerating || pendingResponseIds.includes(responseId)) return;

    setResponseToReject(null);
    setPendingResponseIds((prev) => [...prev, responseId]);

    startModerationTransition(async () => {
      try {
        const result = await moderateRsvpResponsesAction({
          mode: "reject",
          responseIds: [responseId],
        });

        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        toast.success("RSVP rejected.");
        setResponses((current) =>
          current.map((r) =>
            r.id === responseId
              ? {
                  ...r,
                  hostConfirmationStatus: "pending",
                  hostConfirmedAt: null,
                  hostConfirmedBy: null,
                  reviewStatus: "rejected",
                }
              : r,
          ),
        );
        setSelectedResponse((current) =>
          current?.id === responseId
            ? {
                ...current,
                hostConfirmationStatus: "pending",
                hostConfirmedAt: null,
                hostConfirmedBy: null,
                reviewStatus: "rejected",
              }
            : current,
        );
        invalidateResponseQueries(queryClient);
      } finally {
        setPendingResponseIds((prev) => prev.filter((id) => id !== responseId));
      }
    });
  }

  function handleRestoreResponse(responseId: string) {
    if (isModerating || pendingResponseIds.includes(responseId)) return;

    setPendingResponseIds((prev) => [...prev, responseId]);

    startModerationTransition(async () => {
      try {
        const result = await moderateRsvpResponsesAction({
          mode: "approve",
          responseIds: [responseId],
        });

        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        toast.success("RSVP restored.");
        setResponses((current) =>
          current.map((r) => (r.id === responseId ? { ...r, reviewStatus: "approved" } : r)),
        );
        setSelectedResponse((current) =>
          current?.id === responseId ? { ...current, reviewStatus: "approved" } : current,
        );
        invalidateResponseQueries(queryClient);
      } finally {
        setPendingResponseIds((prev) => prev.filter((id) => id !== responseId));
      }
    });
  }

  function handleGuestbookModeration(mode: "approve" | "remove", responseIds: string[]) {
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
          invalidateResponseQueries(queryClient);
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
          skippedUnauthorizedCount > 0 ? `${skippedUnauthorizedCount} could not be verified` : null,
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

function invalidateResponseQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.responses() });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.home() });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.event() });
}
