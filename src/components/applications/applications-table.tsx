"use client";

import {
  type ColumnDef,
  type RowSelectionState,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { useMemo } from "react";
import type { ApplicationListItem } from "@/server/queries/admin-applications";
import {
  ApplicationPlanBadge,
  ApplicationStatusBadge,
  PaymentPreferenceBadge,
} from "@/components/applications/application-badges";
import { ApplicationBulkActions } from "@/components/applications/application-bulk-actions";
import { AdminDataTable } from "@/components/admin-data-table/admin-data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAdminWorkflowUiStore } from "@/stores/admin-workflow-ui-store";

type ApplicationsTableProps = {
  hasActiveFilters: boolean;
  items: ApplicationListItem[];
};

export function ApplicationsTable({ hasActiveFilters, items }: ApplicationsTableProps) {
  "use no memo";

  const rowSelection = useAdminWorkflowUiStore((state) => state.rowSelections.applications);
  const setRowSelection = useAdminWorkflowUiStore((state) => state.setRowSelection);

  const columns = useMemo<ColumnDef<ApplicationListItem>[]>(
    () => [
      {
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select application from ${row.original.fullName}`}
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
          />
        ),
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all applications on this page"
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(checked) => table.toggleAllPageRowsSelected(Boolean(checked))}
          />
        ),
        id: "select",
        meta: {
          cellClassName: "px-3 align-top",
          className: "w-11 px-3",
        },
      },
      {
        cell: ({ row }) => (
          <div className="min-w-0 space-y-1">
            <p className="truncate font-medium">{row.original.fullName}</p>
            <p className="text-muted-foreground truncate text-xs">{row.original.email}</p>
            {row.original.phone ? (
              <p className="text-muted-foreground truncate text-xs">{row.original.phone}</p>
            ) : null}
          </div>
        ),
        header: "Applicant",
        id: "applicant",
        meta: {
          cellClassName: "max-w-0 align-top whitespace-normal",
        },
      },
      {
        cell: ({ row }) => (
          <div className="min-w-0 space-y-1">
            <p className="truncate font-medium">{row.original.eventType}</p>
            <p className="text-muted-foreground text-xs">{formatDate(row.original.eventDate)}</p>
            <p className="text-muted-foreground truncate text-xs">
              {row.original.eventLocation ?? "No location"}
            </p>
          </div>
        ),
        header: "Event",
        id: "event",
        meta: {
          cellClassName: "max-w-0 align-top whitespace-normal",
        },
      },
      {
        cell: ({ row }) => (
          <ApplicationPlanBadge
            className="max-w-full"
            label={row.original.preferredPlanLabel}
            plan={row.original.preferredPlan}
          />
        ),
        header: "Package",
        id: "package",
        meta: {
          cellClassName: "align-top",
          className: "w-28",
        },
      },
      {
        cell: ({ row }) => (
          <PaymentPreferenceBadge
            className="max-w-full"
            label={row.original.preferredManualPaymentOptionLabel}
            paymentPreference={row.original.preferredManualPaymentOption}
          />
        ),
        header: "Payment Pref",
        id: "paymentPreference",
        meta: {
          cellClassName: "align-top",
          className: "w-32",
        },
      },
      {
        cell: ({ row }) => (
          <ApplicationStatusBadge
            className="max-w-full"
            label={row.original.statusLabel}
            status={row.original.status}
          />
        ),
        header: "Status",
        id: "status",
        meta: {
          cellClassName: "align-top",
          className: "w-32",
        },
      },
      {
        cell: ({ row }) => (
          <div className="space-y-1 text-xs">
            <p>{formatSubmittedDate(row.original.submittedAt)}</p>
            <p className="text-muted-foreground">{formatSubmittedTime(row.original.submittedAt)}</p>
          </div>
        ),
        header: "Submitted",
        id: "submittedAt",
        meta: {
          cellClassName: "align-top whitespace-normal",
          className: "w-28",
        },
      },
      {
        cell: ({ row }) => (
          <Button asChild size="sm" variant="outline">
            <Link href={row.original.href}>View</Link>
          </Button>
        ),
        header: "View",
        id: "action",
        meta: {
          cellClassName: "text-right align-top",
          className: "w-24 text-right",
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    columns,
    data: items,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    onRowSelectionChange: (updater) => {
      const nextValue =
        typeof updater === "function" ? updater(rowSelection as RowSelectionState) : updater;

      setRowSelection("applications", nextValue);
    },
    state: {
      rowSelection,
    },
  });

  return (
    <section className="hidden space-y-3 xl:block">
      <ApplicationBulkActions
        applicationIds={table.getSelectedRowModel().rows.map((row) => row.original.id)}
        onClearSelection={() => setRowSelection("applications", {})}
      />
      <AdminDataTable
        colSpan={8}
        emptyState={{
          description: hasActiveFilters
            ? "Try clearing filters or changing the status tab."
            : "Applications from the public apply form will appear here.",
          title: hasActiveFilters ? "No matching applications" : "No applications yet",
        }}
        table={table}
      />
    </section>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatSubmittedDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function formatSubmittedTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-PH", {
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}
