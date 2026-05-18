"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, MessageCircle, MoreHorizontal, Users, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatResponseSubmittedTable,
  getResponseInitials,
  type RsvpResponseRecord,
} from "./rsvp-responses-types";

type GetRsvpResponseColumnsOptions = {
  onOpenResponse: (response: RsvpResponseRecord) => void;
};

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
          <div className="flex min-w-[220px] items-center gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold"
              style={{
                backgroundColor: "var(--dash-brand-subtle)",
                color: "var(--dash-brand-active)",
              }}
            >
              {getResponseInitials(response.guestName)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-[--dash-foreground]">{response.guestName}</p>
              <p className="truncate text-sm text-[--dash-muted]">{response.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isAttending = row.original.status === "attending";

        return (
          <Badge
            variant="outline"
            className="rounded-full border px-2.5 py-1 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
            style={{
              borderColor: isAttending ? "var(--dash-success)" : "var(--dash-destructive)",
              backgroundColor: isAttending
                ? "var(--dash-success-subtle)"
                : "var(--dash-destructive-subtle)",
              color: isAttending ? "var(--dash-success)" : "var(--dash-destructive)",
            }}
          >
            {isAttending ? (
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
            ) : (
              <XCircle className="size-3.5" aria-hidden="true" />
            )}
            {isAttending ? "Attending" : "Not attending"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "partySize",
      header: "Party",
      cell: ({ row }) => (
        <span
          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
          style={{
            borderColor: "var(--dash-border)",
            backgroundColor: "var(--dash-surface-muted)",
            color: "var(--dash-foreground)",
          }}
        >
          <Users className="size-3.5" aria-hidden="true" />
          {row.original.partySize}
        </span>
      ),
    },
    {
      id: "message",
      header: "Message",
      cell: ({ row }) =>
        row.original.message ? (
          <Badge
            variant="outline"
            className="rounded-full border px-2.5 py-1 text-xs font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
            style={{
              borderColor: "color-mix(in srgb, var(--dash-brand) 48%, white)",
              backgroundColor: "var(--dash-brand-subtle)",
              color: "var(--dash-brand-active)",
            }}
          >
            <MessageCircle className="size-3.5" aria-hidden="true" />
            Has message
          </Badge>
        ) : (
          <span className="text-sm text-[--dash-subtle]">-</span>
        ),
    },
    {
      accessorKey: "submittedAt",
      header: "Submitted",
      cell: ({ row }) => (
        <span className="text-sm text-[--dash-muted]">
          {formatResponseSubmittedTable(row.original.submittedAt)}
        </span>
      ),
    },
    {
      id: "action",
      header: "Action",
      cell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-full text-[--dash-muted] hover:bg-[color:var(--dash-surface-muted)] hover:text-[--dash-foreground]"
          aria-label={`Open response details for ${row.original.guestName}`}
          onClick={(event) => {
            event.stopPropagation();
            onOpenResponse(row.original);
          }}
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </Button>
      ),
    },
  ];
}
