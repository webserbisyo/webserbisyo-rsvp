"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle2,
  Eye,
  MessageCircle,
  MessageCircleHeart,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  getResponseSubmittedDisplay,
  getResponseInitials,
  hasResponseMessage,
  type RsvpResponseRecord,
} from "./rsvp-responses-types";

type GetRsvpResponseColumnsOptions = {
  isModerating: boolean;
  onOpenResponse: (response: RsvpResponseRecord) => void;
  onRemoveFromGuestbook: (responseId: string) => void;
  onShowInGuestbook: (responseId: string) => void;
  pendingResponseIds: Set<string>;
};

function StatusChip({ status }: { status: "attending" | "not_attending" }) {
  const isAttending = status === "attending";
  const Icon = isAttending ? CheckCircle2 : XCircle;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        isAttending
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-rose-50 text-rose-700 ring-rose-200"
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {isAttending ? "Attending" : "Not attending"}
    </span>
  );
}

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

        return (
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#fbf7f3] text-sm font-bold text-[#c96f4c]">
              {getResponseInitials(response.guestName)}
            </div>
            <div>
              <p className="font-bold text-[#2b2521]">{response.guestName}</p>
              <p className="text-xs font-medium text-[#8a7c72]">
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
      cell: ({ row }) => <StatusChip status={row.original.status as "attending" | "not_attending"} />,
    },
    {
      accessorKey: "partySize",
      header: "Party",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fbf7f3] px-3 py-1 text-xs font-bold text-[#65584f]">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          {row.original.partySize}
        </span>
      ),
    },
    {
      id: "message",
      header: "Message",
      cell: ({ row }) =>
        hasResponseMessage(row.original) ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff0e8] px-3 py-1 text-xs font-bold text-[#c96f4c]">
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Has message
          </span>
        ) : (
          <span className="text-[#a89b91]">—</span>
        ),
    },
    {
      accessorKey: "submittedAt",
      header: "Submitted",
      cell: ({ row }) => {
        const submitted = getResponseSubmittedDisplay(row.original.submittedAt);

        return (
          <span
            className="block text-sm font-medium leading-5 text-[#75675e]"
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
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }) => {
        const hasMessage = hasResponseMessage(row.original);
        const isShownInGuestbook = row.original.messagePublicStatus === "approved";
        const isPending = pendingResponseIds.has(row.original.id);
        const isDisabled = isModerating || isPending;

        return (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {hasMessage ? (
              <Button
                type="button"
                variant={isShownInGuestbook ? "outline" : "default"}
                size="sm"
                disabled={isDisabled}
                title={isShownInGuestbook ? "Remove from Guestbook" : "Add to Guestbook"}
                aria-label={isShownInGuestbook ? "Remove from Guestbook" : "Add to Guestbook"}
                className={cn(
                  "inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold",
                  isShownInGuestbook
                    ? "border border-[#efd5ce] bg-white text-[#8a4f43] hover:bg-[#fff6f2]"
                    : "bg-[#cf734e] text-white hover:bg-[#b85f3c]",
                )}
                onClick={(event) => {
                  event.stopPropagation();

                  if (isShownInGuestbook) {
                    onRemoveFromGuestbook(row.original.id);
                    return;
                  }

                  onShowInGuestbook(row.original.id);
                }}
              >
                {isShownInGuestbook ? (
                  <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <MessageCircleHeart className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {isShownInGuestbook ? "Remove" : "Add"}
              </Button>
            ) : null}

            <Button
              type="button"
              variant="outline"
              size="sm"
              title="View response details"
              aria-label="View response details"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#e7d7ca] bg-white px-3 text-xs font-semibold text-[#3b342f] hover:bg-[#fff8f3]"
              onClick={(event) => {
                event.stopPropagation();
                onOpenResponse(row.original);
              }}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              View
            </Button>
          </div>
        );
      },
    },
  ];
}
