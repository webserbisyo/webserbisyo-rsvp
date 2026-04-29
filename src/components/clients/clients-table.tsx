"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { ClientListItem } from "@/server/queries/admin-clients";
import {
  ClientLifecycleStatusBadge,
  ClientPaymentStatusBadge,
  ClientPlanBadge,
} from "@/components/clients/client-badges";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ClientsTableProps = {
  hasActiveFilters: boolean;
  items: ClientListItem[];
};

export function ClientsTable({ hasActiveFilters, items }: ClientsTableProps) {
  const selectionScopeKey = useMemo(() => items.map((client) => client.id).join("|"), [items]);

  return (
    <ClientsTableContent
      key={selectionScopeKey}
      hasActiveFilters={hasActiveFilters}
      items={items}
    />
  );
}

function ClientsTableContent({ hasActiveFilters, items }: ClientsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const allIds = useMemo(() => items.map((client) => client.id), [items]);
  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(allIds) : new Set());
  }

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
  }

  return (
    <section className="hidden space-y-3 xl:block">
      {selectedIds.size > 0 ? (
        <div className="bg-muted/30 flex items-center justify-between rounded-lg border px-4 py-3">
          <p className="text-sm font-medium">{selectedIds.size} selected</p>
          <p className="text-muted-foreground text-sm">Bulk actions coming later</p>
        </div>
      ) : null}

      <div className="bg-card overflow-hidden rounded-lg border">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-11 px-3">
                <HeaderCheckbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Event</TableHead>
              <TableHead className="w-24">Package</TableHead>
              <TableHead className="w-28">Payment</TableHead>
              <TableHead className="w-32">Hosting</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-24 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10">
                  <EmptyState
                    title={hasActiveFilters ? "No matching clients" : "No clients yet"}
                    description={
                      hasActiveFilters
                        ? "Try clearing filters or changing the lifecycle tab."
                        : "Approved and provisioned client records will appear here."
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              items.map((client) => {
                const isSelected = selectedIds.has(client.id);

                return (
                  <TableRow key={client.id} data-state={isSelected ? "selected" : undefined}>
                    <TableCell className="px-3 align-top">
                      <RowCheckbox
                        checked={isSelected}
                        label={`Select client ${client.clientName}`}
                        onCheckedChange={(checked) => toggleOne(client.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="max-w-0 align-top whitespace-normal">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate font-medium">{client.clientName}</p>
                        <p className="text-muted-foreground truncate text-xs">{client.email}</p>
                        {client.phone ? (
                          <p className="text-muted-foreground truncate text-xs">{client.phone}</p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-0 align-top whitespace-normal">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate font-medium">
                          {client.eventTitle ?? "No event yet"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {client.eventDate ? formatDate(client.eventDate) : "No event date"}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {client.eventSlug ? `Slug: ${client.eventSlug}` : "No event slug"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <ClientPlanBadge label={client.planLabel} plan={client.plan} />
                    </TableCell>
                    <TableCell className="align-top">
                      <ClientPaymentStatusBadge
                        label={client.paymentStatusLabel}
                        status={client.paymentStatus}
                      />
                    </TableCell>
                    <TableCell className="align-top whitespace-normal">
                      <div className="space-y-1 text-xs">
                        <p>
                          {client.hostingEndsAt
                            ? `Ends ${formatDateTime(client.hostingEndsAt)}`
                            : "No hosting date"}
                        </p>
                        <p className="text-muted-foreground">
                          {client.renewalRequiredAt
                            ? `Renewal ${formatDateTime(client.renewalRequiredAt)}`
                            : "No renewal date"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <ClientLifecycleStatusBadge
                        label={client.statusLabel}
                        status={client.status}
                      />
                    </TableCell>
                    <TableCell className="text-right align-top">
                      <Button asChild size="sm" variant="outline">
                        <Link href={client.href}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function HeaderCheckbox({
  checked,
  indeterminate,
  onCheckedChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label="Select all clients on this page"
      checked={checked}
      className="border-border text-rsvp-brand focus:ring-rsvp-brand/20 size-4 rounded"
      onChange={(event) => onCheckedChange(event.currentTarget.checked)}
    />
  );
}

function RowCheckbox({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      className="border-border text-rsvp-brand focus:ring-rsvp-brand/20 size-4 rounded"
      onChange={(event) => onCheckedChange(event.currentTarget.checked)}
    />
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}
