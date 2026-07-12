"use client";

import {
  type ColumnDef,
  type RowSelectionState,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { useMemo } from "react";
import type { ClientListItem } from "@/server/queries/admin-clients";
import {
  ClientLifecycleStatusBadge,
  ClientPaymentStatusBadge,
  ClientPlanBadge,
  ClientStoredStatusBadge,
} from "@/components/clients/client-badges";
import { ClientBulkActions } from "@/components/clients/client-bulk-actions";
import { AdminDataTable } from "@/components/admin-data-table/admin-data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAdminWorkflowUiStore } from "@/stores/admin-workflow-ui-store";

type ClientsTableProps = {
  hasActiveFilters: boolean;
  items: ClientListItem[];
  packageDefaultAvailability: Record<"max" | "pro", boolean>;
};

export function ClientsTable({
  hasActiveFilters,
  items,
  packageDefaultAvailability,
}: ClientsTableProps) {
  "use no memo";

  const rowSelection = useAdminWorkflowUiStore((state) => state.rowSelections.clients);
  const setRowSelection = useAdminWorkflowUiStore((state) => state.setRowSelection);

  const columns = useMemo<ColumnDef<ClientListItem>[]>(
    () => [
      {
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select client ${row.original.clientName}`}
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
          />
        ),
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all clients on this page"
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
            <p className="truncate font-medium">{row.original.clientName}</p>
            <p className="text-muted-foreground truncate text-xs">{row.original.email}</p>
          </div>
        ),
        header: "Client",
        id: "client",
        meta: {
          cellClassName: "max-w-0 align-top whitespace-normal",
        },
      },
      {
        cell: ({ row }) => (
          <div className="min-w-0 space-y-1">
            <p className="truncate font-medium">{row.original.eventTypeLabel ?? "No event yet"}</p>
            {row.original.eventDate ? (
              <p className="text-muted-foreground text-xs">{formatDate(row.original.eventDate)}</p>
            ) : null}
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
          <ClientPlanBadge label={row.original.planLabel} plan={row.original.plan} />
        ),
        header: "Package",
        id: "package",
        meta: {
          cellClassName: "align-top",
          className: "w-24",
        },
      },
      {
        cell: ({ row }) => (
          <ClientPaymentStatusBadge
            label={row.original.paymentStatusLabel}
            status={row.original.paymentStatus}
          />
        ),
        header: "Payment Status",
        id: "payment",
        meta: {
          cellClassName: "align-top",
          className: "w-36",
        },
      },
      {
        cell: ({ row }) => (
          <ClientStoredStatusBadge
            label={row.original.clientStatusLabel}
            status={row.original.clientStatus}
          />
        ),
        header: "Client Status",
        id: "status",
        meta: {
          cellClassName: "align-top",
          className: "w-32",
        },
      },
      {
        cell: ({ row }) => (
          <ClientLifecycleStatusBadge
            label={row.original.statusLabel}
            status={row.original.status}
          />
        ),
        header: "Lifecycle",
        id: "lifecycle",
        meta: {
          cellClassName: "align-top",
          className: "w-40",
        },
      },
      {
        cell: ({ row }) => (
          <Button asChild size="sm" variant="outline">
            <Link href={row.original.href}>View</Link>
          </Button>
        ),
        header: "Action",
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

      setRowSelection("clients", nextValue);
    },
    state: {
      rowSelection,
    },
  });
  const selectedClients = table.getSelectedRowModel().rows.map((row) => row.original);

  return (
    <section className="hidden space-y-3 xl:block">
      <ClientBulkActions
        packageDefaultAvailability={packageDefaultAvailability}
        selectedClients={selectedClients}
        onClearSelection={() => setRowSelection("clients", {})}
        onDeleteResult={(failedClientIds) =>
          setRowSelection(
            "clients",
            Object.fromEntries(failedClientIds.map((clientId) => [clientId, true])),
          )
        }
      />
      <AdminDataTable
        colSpan={8}
        emptyState={{
          description: hasActiveFilters
            ? "Try clearing filters or changing the lifecycle tab."
            : "Approved and provisioned client records will appear here.",
          title: hasActiveFilters ? "No matching clients" : "No clients yet",
        }}
        table={table}
      />
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(`${value}T00:00:00.000Z`));
}
