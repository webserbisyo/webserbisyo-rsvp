"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { RsvpResponseDetailDialog } from "./rsvp-response-detail-dialog";
import { RsvpResponseExportDialog } from "./rsvp-response-export-dialog";
import { RSVP_RESPONSES_MOCK_DATA } from "./rsvp-responses-mock-data";
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

export function RsvpResponsesPage() {
  const [activeTab, setActiveTab] = useState<RsvpResponsesTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RsvpResponsesStatusFilter>("all");
  const [selectedResponse, setSelectedResponse] = useState<RsvpResponseRecord | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const allResponses = RSVP_RESPONSES_MOCK_DATA;
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

  return (
    <div className="space-y-4 pb-24 md:pb-8">
      <header className="flex flex-col gap-1.5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-[--dash-heading-muted] uppercase">
            Dashboard
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[--dash-foreground] md:text-4xl">
            RSVP Responses
          </h1>
        </div>

        <Badge
          variant="outline"
          className="inline-flex h-9 items-center gap-2 self-start rounded-full border px-3.5 text-sm font-medium shadow-[var(--dash-shadow-sm)] md:self-auto"
          style={{
            borderColor: "var(--dash-border)",
            backgroundColor: "var(--dash-surface)",
            color: "var(--dash-foreground)",
          }}
        >
          <span
            className="inline-flex size-2.5 rounded-full"
            style={{
              backgroundColor: "var(--dash-success)",
            }}
          />
          Live responses
        </Badge>
      </header>

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
        allResponsesCount={totalResponses}
        currentViewCount={currentViewCount}
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
      />
    </div>
  );
}
