"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  getResponseSubmittedDisplay,
  getResponseInitials,
  type RsvpResponseRecord,
} from "./rsvp-responses-types";
import {
  RsvpResponseMessageBadge,
  RsvpResponsePartySizeBadge,
  RsvpResponseRowActions,
  RsvpResponseStatusBadge,
} from "./rsvp-response-ui";

type GetRsvpResponseColumnsOptions = {
  isModerating: boolean;
  onOpenResponse: (response: RsvpResponseRecord) => void;
  onRemoveFromGuestbook: (responseId: string) => void;
  onShowInGuestbook: (responseId: string) => void;
  pendingResponseIds: Set<string>;
};

export function getRsvpResponseColumns({
  isModerating,
  onOpenResponse,
  onRemoveFromGuestbook,
  onShowInGuestbook,
  pendingResponseIds,
}: GetRsvpResponseColumnsOptions): ColumnDef<RsvpResponseRecord>[] {
  return [
    {
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select response from ${row.original.guestName}`}
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
          onClick={(event) => event.stopPropagation()}
        />
      ),
      enableSorting: false,
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all responses on this page"
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(checked) => table.toggleAllPageRowsSelected(Boolean(checked))}
          onClick={(event) => event.stopPropagation()}
        />
      ),
      id: "select",
    },
    {
      accessorKey: "guestName",
      header: "Guest",
      cell: ({ row }) => {
        const response = row.original;
        const isRejected = response.reviewStatus === "rejected";

        return (
          <div className={cn("flex items-center gap-3", isRejected && "opacity-60")}>
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#fbf7f3] text-sm font-bold text-[#c96f4c]">
              {getResponseInitials(response.guestName)}
            </div>
            <div className="max-w-[240px] min-w-0">
              <p className="truncate font-bold text-[#2b2521]" title={response.guestName}>
                {response.guestName}
              </p>
              <p
                className="truncate text-xs font-medium text-[#8a7c72]"
                title={response.email ?? "No email added"}
              >
                {response.email ?? "No email added"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isRejected = row.original.reviewStatus === "rejected";
        return (
          <div className={cn(isRejected && "opacity-60")}>
            <RsvpResponseStatusBadge
              reviewStatus={row.original.reviewStatus}
              status={row.original.status as "attending" | "not_attending"}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "partySize",
      header: "Party",
      cell: ({ row }) => {
        const isRejected = row.original.reviewStatus === "rejected";
        return (
          <div className={cn(isRejected && "opacity-60")}>
            <RsvpResponsePartySizeBadge partySize={row.original.partySize} />
          </div>
        );
      },
    },
    {
      id: "message",
      header: "Message",
      cell: ({ row }) => {
        const isRejected = row.original.reviewStatus === "rejected";
        return (
          <div className={cn(isRejected && "opacity-60")}>
            <RsvpResponseMessageBadge response={row.original} />
          </div>
        );
      },
    },
    {
      accessorKey: "submittedAt",
      header: "Submitted",
      cell: ({ row }) => {
        const submitted = getResponseSubmittedDisplay(row.original.submittedAt);
        const isRejected = row.original.reviewStatus === "rejected";

        return (
          <span
            className={cn(
              "block text-sm leading-5 font-medium text-[#75675e]",
              isRejected && "opacity-60",
            )}
            title={submitted.fullLabel}
            aria-label={`Submitted ${submitted.fullLabel}`}
          >
            <span className="hidden xl:block">{submitted.wideLabel}</span>
            <span className="hidden whitespace-nowrap md:block xl:hidden">
              {submitted.compactLabel}
            </span>
            <span className="grid gap-0.5 md:hidden">
              <span>{submitted.mobileDateLabel}</span>
              {submitted.mobileTimeLabel ? <span>{submitted.mobileTimeLabel}</span> : null}
            </span>
          </span>
        );
      },
    },
    {
      id: "action",
      header: () => <div className="min-w-[160px] text-right">Action</div>,
      cell: ({ row }) => (
        <RsvpResponseRowActions
          align="end"
          isModerating={isModerating}
          onOpenResponse={onOpenResponse}
          onRemoveFromGuestbook={onRemoveFromGuestbook}
          onShowInGuestbook={onShowInGuestbook}
          pendingResponseIds={pendingResponseIds}
          response={row.original}
        />
      ),
    },
  ];
}
