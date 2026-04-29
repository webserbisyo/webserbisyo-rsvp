"use client";

import {
  type ColumnDef,
  type RowSelectionState,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { useMemo } from "react";
import type { SalesListItem } from "@/server/queries/admin-sales";
import { PaymentStatusBadge } from "@/components/applications/application-badges";
import { AdminDataTable } from "@/components/admin-data-table/admin-data-table";
import { SelectionToolbar } from "@/components/admin-data-table/selection-toolbar";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PaymentDetailSheet } from "@/components/sales/payment-detail-sheet";
import { useAdminWorkflowUiStore } from "@/stores/admin-workflow-ui-store";

type SalesTableProps = {
  hasActiveFilters: boolean;
  items: SalesListItem[];
};

export function SalesTable({ hasActiveFilters, items }: SalesTableProps) {
  "use no memo";

  const rowSelection = useAdminWorkflowUiStore((state) => state.rowSelections.sales);
  const salesDetailPaymentId = useAdminWorkflowUiStore((state) => state.salesDetailPaymentId);
  const setRowSelection = useAdminWorkflowUiStore((state) => state.setRowSelection);
  const openSalesDetail = useAdminWorkflowUiStore((state) => state.openSalesDetail);
  const closeSalesDetail = useAdminWorkflowUiStore((state) => state.closeSalesDetail);

  const columns = useMemo<ColumnDef<SalesListItem>[]>(
    () => [
      {
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select payment ${row.original.id}`}
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
          />
        ),
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all payments on this page"
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
        accessorKey: "application",
        cell: ({ row }) => (
          <div className="min-w-0 space-y-1">
            <p className="truncate font-medium">
              {row.original.client?.name ?? row.original.application?.title ?? "Pending payment"}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {row.original.client?.email ??
                row.original.application?.email ??
                "No client email yet"}
            </p>
            {row.original.application?.href ? (
              <Link
                href={row.original.application.href}
                className="text-xs underline underline-offset-4"
              >
                {row.original.application.referenceCode ?? row.original.application.id}
              </Link>
            ) : null}
          </div>
        ),
        header: "Client / Application",
        id: "clientApplication",
        meta: {
          cellClassName: "max-w-0 align-top whitespace-normal",
        },
      },
      {
        accessorKey: "planTypeLabel",
        cell: ({ row }) => row.original.planTypeLabel,
        header: "Package",
        meta: {
          cellClassName: "align-top",
          className: "w-24",
        },
      },
      {
        accessorKey: "amountDue",
        cell: ({ row }) => (
          <div className="space-y-1 text-sm">
            <p className="font-medium">{formatCurrency(row.original.amountDue)}</p>
            <p className="text-muted-foreground text-xs">
              Paid {formatCurrency(row.original.amountPaid)}
            </p>
          </div>
        ),
        header: "Amount",
        meta: {
          cellClassName: "align-top",
          className: "w-32",
        },
      },
      {
        accessorKey: "paymentMethod",
        cell: ({ row }) => row.original.paymentMethod ?? "—",
        header: "Method",
        meta: {
          cellClassName: "align-top",
          className: "w-28",
        },
      },
      {
        accessorKey: "referenceNumber",
        cell: ({ row }) => row.original.referenceNumber ?? "—",
        header: "Reference",
        meta: {
          cellClassName: "align-top",
          className: "w-32",
        },
      },
      {
        accessorKey: "paidAt",
        cell: ({ row }) => (
          <div className="space-y-1 text-xs">
            <p>{formatDateTime(row.original.paidAt ?? row.original.createdAt)}</p>
            <p className="text-muted-foreground">{row.original.paidAt ? "Paid" : "Created"}</p>
          </div>
        ),
        header: "Date",
        meta: {
          cellClassName: "align-top whitespace-normal",
          className: "w-28",
        },
      },
      {
        accessorKey: "paymentStatusLabel",
        cell: ({ row }) => (
          <PaymentStatusBadge
            className="max-w-full"
            label={row.original.paymentStatusLabel}
            status={row.original.paymentStatus}
          />
        ),
        header: "Status",
        meta: {
          cellClassName: "align-top",
          className: "w-28",
        },
      },
      {
        cell: ({ row }) => (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => openSalesDetail(row.original.id)}
          >
            View
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
    [openSalesDetail],
  );

  const table = useReactTable({
    columns,
    data: items,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    onRowSelectionChange: (updater) => {
      const nextValue =
        typeof updater === "function" ? updater(rowSelection as RowSelectionState) : updater;

      setRowSelection("sales", nextValue);
    },
    state: {
      rowSelection,
    },
  });

  const selectedPayment = items.find((item) => item.id === salesDetailPaymentId) ?? null;

  return (
    <>
      <section className="hidden space-y-3 xl:block">
        <SelectionToolbar count={table.getSelectedRowModel().rows.length} />
        <AdminDataTable
          colSpan={8}
          emptyState={{
            description: hasActiveFilters
              ? "Try clearing filters or changing the payment status."
              : "Pending and confirmed manual payments will appear here.",
            title: hasActiveFilters ? "No matching payments" : "No payments yet",
          }}
          table={table}
        />
      </section>

      <PaymentDetailSheet
        open={Boolean(selectedPayment)}
        onClose={closeSalesDetail}
        payment={selectedPayment}
      />
    </>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    style: "currency",
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}
