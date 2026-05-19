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
import { ChevronLeft, ChevronRight, Download, Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { getRsvpResponseColumns } from "./rsvp-response-columns";
import { RsvpResponsesEmptyState } from "./rsvp-responses-empty-state";
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
    <Card className="overflow-hidden rounded-[1.6rem] border border-[#eadbd0] bg-white/80 shadow-sm shadow-[#8a4b2e]/5 p-0">
      <div className="border-b border-[#eadbd0] bg-white/70 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <ScrollArea className="w-full whitespace-nowrap lg:w-auto">
            <Tabs value={activeTab} onValueChange={(value) => onActiveTabChange(value as RsvpResponsesTab)}>
              <TabsList className="flex overflow-x-auto rounded-2xl bg-[#fbf7f3] p-1 h-auto w-auto justify-start border-0">
                <TabsTrigger
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-[#8a7c72] transition hover:text-[#2b2521] data-[state=active]:bg-white data-[state=active]:text-[#c96f4c] data-[state=active]:shadow-sm border-0"
                  value="all"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-[#8a7c72] transition hover:text-[#2b2521] data-[state=active]:bg-white data-[state=active]:text-[#c96f4c] data-[state=active]:shadow-sm border-0"
                  value="attending"
                >
                  Attending
                </TabsTrigger>
                <TabsTrigger
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-[#8a7c72] transition hover:text-[#2b2521] data-[state=active]:bg-white data-[state=active]:text-[#c96f4c] data-[state=active]:shadow-sm border-0"
                  value="not_attending"
                >
                  Not attending
                </TabsTrigger>
                <TabsTrigger
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-[#8a7c72] transition hover:text-[#2b2521] data-[state=active]:bg-white data-[state=active]:text-[#c96f4c] data-[state=active]:shadow-sm border-0"
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
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#e7d7ca] bg-white px-3 text-sm font-semibold text-[#3b342f] hover:bg-[#fff8f3]"
            onClick={onExportClick}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a88d7f]"
              aria-hidden="true"
            />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search name, email, or phone"
              className="h-11 w-full rounded-2xl border border-[#eadbd0] bg-white px-10 text-sm font-medium text-[#2b2521] outline-none placeholder:text-[#a88d7f] focus:border-[#d9896c] focus:ring-4 focus:ring-[#d9896c]/10"
              aria-label="Search responses by guest name, email, or phone"
            />
          </div>

          <div className="w-full sm:w-[240px]">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RsvpResponsesStatusFilter)}>
              <SelectTrigger
                className="h-11 w-full rounded-2xl border border-[#eadbd0] bg-white px-4 text-sm font-semibold text-[#2b2521] outline-none focus:border-[#d9896c] focus:ring-4 focus:ring-[#d9896c]/10"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <SlidersHorizontal className="h-4 w-4 text-[#a88d7f]" aria-hidden="true" />
                  <SelectValue placeholder="All statuses" />
                </span>
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={8}
                align="start"
                className="z-[80] rounded-[20px] border border-[#eadbd0] bg-[#fffaf6] p-1 text-[#2b2521] shadow-lg shadow-[#2b2521]/10 ring-0"
              >
                <SelectItem className="rounded-[14px] px-3 py-2 text-sm font-medium focus:bg-[#fff0e8] focus:text-[#c96f4c]" value="all">All statuses</SelectItem>
                <SelectItem className="rounded-[14px] px-3 py-2 text-sm font-medium focus:bg-[#fff0e8] focus:text-[#c96f4c]" value="attending">Attending</SelectItem>
                <SelectItem className="rounded-[14px] px-3 py-2 text-sm font-medium focus:bg-[#fff0e8] focus:text-[#c96f4c]" value="not_attending">Not attending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {!hasResponses || filteredRowCount === 0 ? (
        <div className="px-6 py-8">
          <RsvpResponsesEmptyState variant={hasResponses ? "no-results" : "empty"} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[820px] text-left text-sm border-0">
            <TableHeader className="border-b border-[#eadbd0] bg-[#fffaf6] text-xs uppercase tracking-[0.14em] text-[#9a8b80]">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-0 hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-auto px-5 py-4 font-bold text-[#9a8b80]",
                        header.id === "action" && "text-right"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="divide-y divide-[#f0e5dc] border-0">
              {pageRows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer border-0 transition hover:bg-[#fff8f3]"
                  onClick={() => onOpenResponse(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-5 py-4 align-middle border-0">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-[#eadbd0] bg-white/70 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm font-medium text-[#8a7c72]">
          Showing <span className="font-bold text-[#2b2521]">{firstItem}–{lastItem}</span> of {totalRows} responses
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-[#75675e]">Rows per page</span>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(value) =>
                setPagination({
                  pageIndex: 0,
                  pageSize: Number(value),
                })
              }
            >
              <SelectTrigger
                className="h-9 w-[72px] rounded-xl border border-[#eadbd0] bg-white px-3 text-sm font-bold text-[#2b2521] outline-none focus:border-[#d9896c] focus:ring-4 focus:ring-[#d9896c]/10"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={8}
                align="end"
                className="z-[80] rounded-[20px] border border-[#eadbd0] bg-[#fffaf6] p-1 text-[#2b2521] shadow-lg shadow-[#2b2521]/10 ring-0"
              >
                <SelectItem className="rounded-[14px] px-3 py-2 text-sm font-medium focus:bg-[#fff0e8] focus:text-[#c96f4c]" value="5">5</SelectItem>
                <SelectItem className="rounded-[14px] px-3 py-2 text-sm font-medium focus:bg-[#fff0e8] focus:text-[#c96f4c]" value="10">10</SelectItem>
                <SelectItem className="rounded-[14px] px-3 py-2 text-sm font-medium focus:bg-[#fff0e8] focus:text-[#c96f4c]" value="25">25</SelectItem>
                <SelectItem className="rounded-[14px] px-3 py-2 text-sm font-medium focus:bg-[#fff0e8] focus:text-[#c96f4c]" value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#e7d7ca] bg-white px-3 text-sm font-semibold text-[#3b342f] hover:bg-[#fff8f3]"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#e7d7ca] bg-white px-3 text-sm font-semibold text-[#3b342f] hover:bg-[#fff8f3]"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
