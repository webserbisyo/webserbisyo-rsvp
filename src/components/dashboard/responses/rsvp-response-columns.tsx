"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, MessageCircle, MoreHorizontal, Users, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatResponseSubmittedTable,
  getResponseInitials,
  type RsvpResponseRecord,
} from "./rsvp-responses-types";

type GetRsvpResponseColumnsOptions = {
  onOpenResponse: (response: RsvpResponseRecord) => void;
};

function RsvpChip({
  icon: Icon,
  label,
  variant,
}: {
  icon: React.ElementType;
  label: React.ReactNode;
  variant: "attending" | "not_attending" | "party" | "message";
}) {
  const styles = {
    attending: {
      bg: "#e9f5ed",
      border: "#cce8d6",
      text: "#1b5e3a",
    },
    not_attending: {
      bg: "#fdf0f0",
      border: "#fadbdc",
      text: "#912c2c",
    },
    party: {
      bg: "#f6f4f1",
      border: "#e8e4de",
      text: "#524b45",
    },
    message: {
      bg: "#fdf1ec",
      border: "#faddd2",
      text: "#a34f32",
    },
  }[variant];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
      style={{
        backgroundColor: styles.bg,
        borderColor: styles.border,
        color: styles.text,
      }}
    >
      <Icon className="size-3.5 opacity-80" aria-hidden="true" />
      {label}
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
          <div className="flex min-w-[280px] items-center gap-3.5">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-[18px] border text-[15px] font-bold shadow-[0_4px_12px_rgba(62,39,23,0.04)]"
              style={{
                backgroundColor: "#fdfbf9",
                borderColor: "color-mix(in srgb, var(--dash-brand) 12%, var(--dash-border))",
                color: "var(--dash-brand-active)",
              }}
            >
              {getResponseInitials(response.guestName)}
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="truncate text-base font-bold text-gray-900">{response.guestName}</p>
              <p className="truncate text-[13px] font-medium text-gray-500">
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
          <div className="min-w-[120px]">
            <RsvpChip
              icon={isAttending ? CheckCircle2 : XCircle}
              label={isAttending ? "Attending" : "Not attending"}
              variant={isAttending ? "attending" : "not_attending"}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "partySize",
      header: "Party",
      cell: ({ row }) => (
        <div className="min-w-[80px]">
          <RsvpChip icon={Users} label={row.original.partySize} variant="party" />
        </div>
      ),
    },
    {
      id: "message",
      header: "Message",
      cell: ({ row }) => (
        <div className="min-w-[120px]">
          {row.original.message ? (
            <RsvpChip icon={MessageCircle} label="Has message" variant="message" />
          ) : (
            <span className="text-[13px] text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "submittedAt",
      header: "Submitted",
      cell: ({ row }) => (
        <div className="min-w-[120px]">
          <span className="text-[13px] font-medium text-gray-500">
            {formatResponseSubmittedTable(row.original.submittedAt)}
          </span>
        </div>
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
            size="icon-sm"
            className="ml-auto rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-900"
            aria-label={`Open response details for ${row.original.guestName}`}
            onClick={(event) => {
              event.stopPropagation();
              onOpenResponse(row.original);
            }}
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];
}
