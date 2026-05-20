"use client";

import { useState } from "react";
import { ErrorState } from "@/components/feedback/error-state";
import { RsvpResponseDetailDialog } from "./rsvp-response-detail-dialog";
import { RsvpResponseExportDialog } from "./rsvp-response-export-dialog";
import { RsvpResponsesEmptyState } from "./rsvp-responses-empty-state";
import { RsvpResponsesStats } from "./rsvp-responses-stats";
import { RsvpResponsesTable } from "./rsvp-responses-table";
import {
  matchesResponseSearch,
  matchesResponseStatusFilter,
  matchesResponseTab,
  type RsvpResponseRecord,
  type RsvpResponsesStatusFilter,
  type RsvpResponsesTab,
} from "./rsvp-responses-types";

type RsvpResponsesPageProps = {
  errorMessage?: string | null;
  eventSlug?: string | null;
  eventTitle?: string | null;
  hasCurrentEvent: boolean;
  initialResponses: RsvpResponseRecord[];
};

export function RsvpResponsesPage({
  errorMessage = null,
  eventSlug = null,
  eventTitle = null,
  hasCurrentEvent,
  initialResponses,
}: RsvpResponsesPageProps) {
  const [activeTab, setActiveTab] = useState<RsvpResponsesTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RsvpResponsesStatusFilter>("all");
  const [selectedResponse, setSelectedResponse] = useState<RsvpResponseRecord | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const allResponses = initialResponses;
  const scopedResponses = allResponses.filter(
    (response) =>
      matchesResponseTab(response, activeTab) &&
      matchesResponseStatusFilter(response, statusFilter),
  );
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
            onExportClick={() => setIsExportOpen(true)}
            onOpenResponse={setSelectedResponse}
            responses={scopedResponses}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
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
}
