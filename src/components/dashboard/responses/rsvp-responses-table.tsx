"use client";

import { useEffect, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Download, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRsvpResponseColumns } from "./rsvp-response-columns";
import { RsvpResponsesEmptyState } from "./rsvp-responses-empty-state";
import { RESPONSES_PORTAL_THEME_STYLE } from "./rsvp-responses-theme";
import {
  matchesResponseSearch,
  type RsvpResponseRecord,
  type RsvpResponsesStatusFilter,
  type RsvpResponsesTab,
} from "./rsvp-responses-types";

type RsvpResponsesTableProps = {
  activeTab: RsvpResponsesTab;
  hasResponses: boolean;
  onActiveTabChange: (value: RsvpResponsesTab) => void;
  onExportClick: () => void;
  onOpenResponse: (response: RsvpResponseRecord) => void;
  responses: RsvpResponseRecord[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: RsvpResponsesStatusFilter;
  setStatusFilter: (value: RsvpResponsesStatusFilter) => void;
};

export function RsvpResponsesTable({
  activeTab,
  hasResponses,
  onActiveTabChange,
  onExportClick,
  onOpenResponse,
  responses,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
}: RsvpResponsesTableProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [activeTab, searchQuery, statusFilter]);

  // TanStack Table exposes an instance API that React Compiler intentionally flags.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns: getRsvpResponseColumns({ onOpenResponse }),
    data: responses,
    state: {
      globalFilter: searchQuery,
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) =>
      matchesResponseSearch(row.original, String(filterValue ?? "")),
  });

  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const pageRows = table.getRowModel().rows;
  const totalRows = filteredRowCount;
  const firstItem = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const lastItem =
    totalRows === 0 ? 0 : Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows);

  return (
    <Card className="rsvp-panel overflow-hidden rounded-[32px] border-[color:var(--dash-border)] bg-[color:var(--dash-surface)] py-0 shadow-[var(--dash-shadow-md)]">
      <CardContent className="px-0 py-0">
        <div className="flex flex-col gap-3 border-b border-[color:var(--dash-border)] px-4 py-3.5">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <ScrollArea className="w-full whitespace-nowrap lg:w-auto">
              <Tabs value={activeTab} onValueChange={(value) => onActiveTabChange(value as RsvpResponsesTab)}>
                <TabsList
                  className="rounded-full border border-[color:var(--dash-border)] bg-[color:var(--dash-surface-muted)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
                  variant="default"
                >
                  <TabsTrigger
                    className="rounded-full px-3.5 py-1.5 text-sm text-[--dash-muted] data-active:bg-[color:var(--dash-surface)] data-active:text-[--dash-foreground] data-active:shadow-[var(--dash-shadow-sm)]"
                    value="all"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    className="rounded-full px-3.5 py-1.5 text-sm text-[--dash-muted] data-active:bg-[color:var(--dash-surface)] data-active:text-[--dash-foreground] data-active:shadow-[var(--dash-shadow-sm)]"
                    value="attending"
                  >
                    Attending
                  </TabsTrigger>
                  <TabsTrigger
                    className="rounded-full px-3.5 py-1.5 text-sm text-[--dash-muted] data-active:bg-[color:var(--dash-surface)] data-active:text-[--dash-foreground] data-active:shadow-[var(--dash-shadow-sm)]"
                    value="not_attending"
                  >
                    Not attending
                  </TabsTrigger>
                  <TabsTrigger
                    className="rounded-full px-3.5 py-1.5 text-sm text-[--dash-muted] data-active:bg-[color:var(--dash-surface)] data-active:text-[--dash-foreground] data-active:shadow-[var(--dash-shadow-sm)]"
                    value="messages"
                  >
                    Messages
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </ScrollArea>

            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full border-[color:var(--dash-border)] bg-[color:var(--dash-surface)] px-4 shadow-[var(--dash-shadow-sm)]"
              onClick={onExportClick}
            >
              <Download className="size-4" aria-hidden="true" />
              Export
            </Button>
          </div>

          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[--dash-subtle]"
                aria-hidden="true"
              />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search name, email, or phone"
                className="h-10 rounded-full border-[color:var(--dash-border)] bg-[color:var(--dash-surface-muted)] pr-3 pl-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
                aria-label="Search responses by guest name, email, or phone"
              />
            </div>

            <div className="w-full lg:w-[220px]">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RsvpResponsesStatusFilter)}>
                <SelectTrigger className="h-10 w-full rounded-full border-[color:var(--dash-border)] bg-[color:var(--dash-surface-muted)] px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
                  <span className="flex items-center gap-2 min-w-0">
                    <SlidersHorizontal className="size-4 text-[--dash-subtle]" aria-hidden="true" />
                    <SelectValue placeholder="All statuses" />
                  </span>
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={8}
                  align="start"
                  style={RESPONSES_PORTAL_THEME_STYLE}
                  className="z-[80] rounded-[20px] border-[color:var(--responses-border)] bg-[var(--responses-surface)] text-[color:var(--responses-foreground)] shadow-[var(--responses-shadow-lg)] ring-0"
                >
                  <SelectItem className="rounded-[14px] text-sm data-[highlighted]:bg-[var(--responses-surface-muted)] data-[highlighted]:text-[color:var(--responses-foreground)] data-[state=checked]:text-[color:var(--responses-brand-active)]" value="all">All statuses</SelectItem>
                  <SelectItem className="rounded-[14px] text-sm data-[highlighted]:bg-[var(--responses-surface-muted)] data-[highlighted]:text-[color:var(--responses-foreground)] data-[state=checked]:text-[color:var(--responses-brand-active)]" value="attending">Attending</SelectItem>
                  <SelectItem className="rounded-[14px] text-sm data-[highlighted]:bg-[var(--responses-surface-muted)] data-[highlighted]:text-[color:var(--responses-foreground)] data-[state=checked]:text-[color:var(--responses-brand-active)]" value="not_attending">Not attending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {!hasResponses || filteredRowCount === 0 ? (
          <div className="px-4 py-6">
            <RsvpResponsesEmptyState variant={hasResponses ? "no-results" : "empty"} />
          </div>
        ) : (
          <div className="px-4 py-2">
            <Table className="min-w-[880px]">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="border-[color:var(--dash-divider)] bg-[color:var(--dash-surface-muted)]"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="h-11 px-3 text-[11px] font-semibold tracking-[0.16em] text-[--dash-heading-muted] uppercase"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer border-[color:var(--dash-divider)] hover:bg-[color:var(--dash-surface-muted)]"
                    onClick={() => onOpenResponse(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-3 py-2.5 align-top">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="border-t border-[color:var(--dash-border)] bg-[color:var(--dash-surface-muted)] px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-[--dash-muted]">
              Showing {firstItem}-{lastItem} of {totalRows} responses
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[--dash-muted]">Rows per page</span>
                <Select
                  value={String(pagination.pageSize)}
                  onValueChange={(value) =>
                    setPagination({
                      pageIndex: 0,
                      pageSize: Number(value),
                    })
                  }
                >
                  <SelectTrigger className="h-9 w-[88px] rounded-full border-[color:var(--dash-border)] bg-[color:var(--dash-surface)] px-3 shadow-[var(--dash-shadow-sm)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={8}
                    align="end"
                    style={RESPONSES_PORTAL_THEME_STYLE}
                    className="z-[80] rounded-[20px] border-[color:var(--responses-border)] bg-[var(--responses-surface)] text-[color:var(--responses-foreground)] shadow-[var(--responses-shadow-lg)] ring-0"
                  >
                    <SelectItem className="rounded-[14px] text-sm data-[highlighted]:bg-[var(--responses-surface-muted)] data-[highlighted]:text-[color:var(--responses-foreground)] data-[state=checked]:text-[color:var(--responses-brand-active)]" value="5">5</SelectItem>
                    <SelectItem className="rounded-[14px] text-sm data-[highlighted]:bg-[var(--responses-surface-muted)] data-[highlighted]:text-[color:var(--responses-foreground)] data-[state=checked]:text-[color:var(--responses-brand-active)]" value="10">10</SelectItem>
                    <SelectItem className="rounded-[14px] text-sm data-[highlighted]:bg-[var(--responses-surface-muted)] data-[highlighted]:text-[color:var(--responses-foreground)] data-[state=checked]:text-[color:var(--responses-brand-active)]" value="25">25</SelectItem>
                    <SelectItem className="rounded-[14px] text-sm data-[highlighted]:bg-[var(--responses-surface-muted)] data-[highlighted]:text-[color:var(--responses-foreground)] data-[state=checked]:text-[color:var(--responses-brand-active)]" value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                >
                  Next
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
