"use client";

import type { Row } from "@tanstack/react-table";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getResponseInitials,
  getResponseSubmittedDisplay,
  type RsvpResponseRecord,
} from "./rsvp-responses-types";
import {
  RsvpResponseMessageBadge,
  RsvpResponsePartySizeBadge,
  RsvpResponseRowActions,
  RsvpResponseStatusBadge,
} from "./rsvp-response-ui";

export function RsvpResponseCardList({
  isModerating,
  onOpenResponse,
  onRemoveFromGuestbook,
  onShowInGuestbook,
  pendingResponseIds,
  rows,
}: {
  isModerating: boolean;
  onOpenResponse: (response: RsvpResponseRecord) => void;
  onRemoveFromGuestbook: (responseId: string) => void;
  onShowInGuestbook: (responseId: string) => void;
  pendingResponseIds: Set<string>;
  rows: Array<Row<RsvpResponseRecord>>;
}) {
  return (
    <div className="grid gap-3 xl:hidden">
      {rows.map((row) => {
        const response = row.original;
        const submitted = getResponseSubmittedDisplay(response.submittedAt);
        const hasMessage = Boolean(response.message && response.message.trim());

        return (
          <article
            key={row.id}
            data-rsvp-response-card
            className="overflow-hidden rounded-[1.45rem] border border-[#eadbd0] bg-[#fffdfb] p-4 shadow-sm shadow-[#8a4b2e]/5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 shrink-0 items-center justify-center">
                <Checkbox
                  aria-label={`Select response from ${response.guestName}`}
                  checked={row.getIsSelected()}
                  onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
                />
              </div>

              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#fbf7f3] text-xs font-bold text-[#c96f4c]">
                {getResponseInitials(response.guestName)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="min-w-0">
                  <p
                    className="truncate text-base font-bold leading-5 text-[#2b2521]"
                    title={response.guestName}
                  >
                    {response.guestName}
                  </p>
                  <p
                    className="mt-1 truncate text-sm font-medium text-[#8a7c72]"
                    title={response.email ?? "No email added"}
                  >
                    {response.email ?? "No email added"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <RsvpResponseStatusBadge status={response.status} />
              <RsvpResponsePartySizeBadge partySize={response.partySize} />
              {hasMessage ? <RsvpResponseMessageBadge response={response} /> : null}
              {response.messagePublicStatus === "approved" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold ring-1 ring-emerald-200 text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  In Guestbook
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fbf7f3] px-2.5 py-1 text-xs font-semibold ring-1 ring-[#eadbd0] text-[#8a7c72]">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Not on Guestbook
                </span>
              )}
            </div>

            <div className="my-3 border-t border-[#f0e3db]" />

            <div className="flex items-center justify-between gap-3">
              <p
                className="whitespace-nowrap text-xs font-medium text-[#8a7c72]"
                title={submitted.fullLabel}
                aria-label={`Submitted ${submitted.fullLabel}`}
              >
                {formatMobileFullDate(response.submittedAt)}
              </p>
              <RsvpResponseRowActions
                actionLabelMode="mobile"
                align="end"
                isModerating={isModerating}
                onOpenResponse={onOpenResponse}
                onRemoveFromGuestbook={onRemoveFromGuestbook}
                onShowInGuestbook={onShowInGuestbook}
                pendingResponseIds={pendingResponseIds}
                response={response}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function formatMobileFullDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  const d = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" }).format(date);
  const t = new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" }).format(date);
  return `${d} \u00B7 ${t}`;
}
