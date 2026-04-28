"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { ApplicationListItem } from "@/server/queries/admin-applications";
import {
  ApplicationPlanBadge,
  ApplicationStatusBadge,
  PaymentPreferenceBadge,
} from "@/components/applications/application-badges";
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

type ApplicationsTableProps = {
  hasActiveFilters: boolean;
  items: ApplicationListItem[];
};

export function ApplicationsTable({ hasActiveFilters, items }: ApplicationsTableProps) {
  const selectionScopeKey = useMemo(
    () => items.map((application) => application.id).join("|"),
    [items],
  );

  return (
    <ApplicationsTableContent
      key={selectionScopeKey}
      hasActiveFilters={hasActiveFilters}
      items={items}
    />
  );
}

function ApplicationsTableContent({ hasActiveFilters, items }: ApplicationsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const allIds = useMemo(() => items.map((application) => application.id), [items]);
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
          <div className="flex items-center gap-3">
            <p className="text-muted-foreground text-sm">Bulk actions coming later</p>
            <Button type="button" variant="outline" size="sm" disabled>
              Coming later
            </Button>
          </div>
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
              <TableHead>Applicant</TableHead>
              <TableHead>Event</TableHead>
              <TableHead className="w-28">Package</TableHead>
              <TableHead className="w-32">Payment</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-28">Submitted</TableHead>
              <TableHead className="w-24 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10">
                  <EmptyState
                    title={hasActiveFilters ? "No matching applications" : "No applications yet"}
                    description={
                      hasActiveFilters
                        ? "Try clearing filters or changing the status tab."
                        : "Applications from the public apply form will appear here."
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              items.map((application) => {
                const isSelected = selectedIds.has(application.id);

                return (
                  <TableRow key={application.id} data-state={isSelected ? "selected" : undefined}>
                    <TableCell className="px-3 align-top">
                      <RowCheckbox
                        checked={isSelected}
                        label={`Select application from ${application.fullName}`}
                        onCheckedChange={(checked) => toggleOne(application.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="max-w-0 align-top whitespace-normal">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate font-medium">{application.fullName}</p>
                        <p className="text-muted-foreground truncate text-xs">
                          {application.email}
                        </p>
                        {application.phone ? (
                          <p className="text-muted-foreground truncate text-xs">
                            {application.phone}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-0 align-top whitespace-normal">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate font-medium">{application.eventType}</p>
                        <p className="text-muted-foreground text-xs">
                          {formatDate(application.eventDate)}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {application.eventLocation ?? "No location"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <ApplicationPlanBadge
                        className="max-w-full"
                        label={application.preferredPlanLabel}
                        plan={application.preferredPlan}
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <PaymentPreferenceBadge
                        className="max-w-full"
                        label={application.preferredManualPaymentOptionLabel}
                        paymentPreference={application.preferredManualPaymentOption}
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <ApplicationStatusBadge
                        className="max-w-full"
                        label={application.statusLabel}
                        status={application.status}
                      />
                    </TableCell>
                    <TableCell className="align-top whitespace-normal">
                      <div className="space-y-1 text-xs">
                        <p>{formatSubmittedDate(application.submittedAt)}</p>
                        <p className="text-muted-foreground">
                          {formatSubmittedTime(application.submittedAt)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right align-top">
                      <Button asChild size="sm" variant="outline">
                        <Link href={application.href}>View</Link>
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
      aria-label="Select all applications on this page"
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
