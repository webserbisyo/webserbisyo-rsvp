"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/feedback/error-state";
import { RsvpResponseDetailDialog } from "./rsvp-response-detail-dialog";
import { RsvpResponseExportDialog } from "./rsvp-response-export-dialog";
import { RsvpResponsesEmptyState } from "./rsvp-responses-empty-state";
import { RsvpResponsesStats } from "./rsvp-responses-stats";
import { RsvpResponsesTable } from "./rsvp-responses-table";
import { RESPONSES_PORTAL_THEME_STYLE } from "./rsvp-responses-theme";
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
    <div style={RESPONSES_PORTAL_THEME_STYLE} className="space-y-5 pb-24 md:space-y-6 md:pb-8">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-[var(--responses-heading-muted)] uppercase">
            Dashboard
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--responses-foreground)] md:text-4xl">
            RSVP Responses
          </h1>
        </div>

        <Badge
          variant="outline"
          className="inline-flex h-10 items-center gap-2.5 self-start rounded-full border px-4 text-sm font-medium shadow-[var(--responses-shadow-sm)] md:self-auto"
          style={{
            borderColor: "var(--responses-border)",
            backgroundColor: "var(--responses-surface)",
            color: "var(--responses-foreground)",
          }}
        >
          <span
            className="inline-flex size-2.5 rounded-full"
            style={{
              backgroundColor: "var(--responses-success)",
            }}
          />
          Responses
        </Badge>
      </header>

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
