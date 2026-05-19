"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, MessageCircle, MoreHorizontal, Users, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatResponseSubmittedTable,
  getResponseInitials,
  type RsvpResponseRecord,
} from "./rsvp-responses-types";

type GetRsvpResponseColumnsOptions = {
  onOpenResponse: (response: RsvpResponseRecord) => void;
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
  onOpenResponse,
}: GetRsvpResponseColumnsOptions): ColumnDef<RsvpResponseRecord>[] {
  return [
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
        row.original.message ? (
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
      cell: ({ row }) => (
        <span className="text-sm font-medium text-[#75675e]">
          {formatResponseSubmittedTable(row.original.submittedAt)}
        </span>
      ),
    },
    {
      id: "action",
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto h-9 w-9 rounded-xl p-0 text-[#776b62] hover:bg-[#f8eee7] hover:text-[#3b342f]"
            aria-label={`Open response details for ${row.original.guestName}`}
            onClick={(event) => {
              event.stopPropagation();
              onOpenResponse(row.original);
            }}
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];
}
