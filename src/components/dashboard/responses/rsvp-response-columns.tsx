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
          <div className="flex min-w-[230px] items-center gap-3.5">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-[18px] text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.58)]"
              style={{
                backgroundColor: "var(--responses-brand-subtle)",
                color: "var(--responses-brand-active)",
              }}
            >
              {getResponseInitials(response.guestName)}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="truncate text-[15px] font-semibold text-[var(--responses-foreground)]">
                {response.guestName}
              </p>
              <p className="truncate text-sm text-[var(--responses-muted)]">
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
        const isAttending = row.original.status === "attending";

        return (
          <Badge
            variant="outline"
            className="rounded-full border px-3 py-1.5 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
            style={{
              borderColor: isAttending ? "var(--responses-success)" : "var(--responses-destructive)",
              backgroundColor: isAttending
                ? "var(--responses-success-subtle)"
                : "var(--responses-destructive-subtle)",
              color: isAttending ? "var(--responses-success)" : "var(--responses-destructive)",
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
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
          style={{
            borderColor: "var(--responses-border)",
            backgroundColor: "var(--responses-surface-muted)",
            color: "var(--responses-foreground)",
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
            className="rounded-full border px-3 py-1.5 text-xs font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
            style={{
              borderColor: "color-mix(in srgb, var(--responses-brand) 34%, white)",
              backgroundColor: "var(--responses-brand-subtle)",
              color: "var(--responses-brand-active)",
            }}
          >
            <MessageCircle className="size-3.5" aria-hidden="true" />
            Has message
          </Badge>
        ) : (
          <span className="text-sm text-[var(--responses-subtle)]">-</span>
        ),
    },
    {
      accessorKey: "submittedAt",
      header: "Submitted",
      cell: ({ row }) => (
        <span className="text-sm text-[var(--responses-muted)]">
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
          className="rounded-full text-[var(--responses-muted)] hover:bg-[color:var(--responses-surface-muted)] hover:text-[var(--responses-foreground)]"
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
