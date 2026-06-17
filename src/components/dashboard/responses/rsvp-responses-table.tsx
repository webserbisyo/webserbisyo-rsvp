"use client";

import { useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type PaginationState,
  type RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  MessageCircleHeart,
  Search,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getRsvpResponseColumns } from "./rsvp-response-columns";
import { RsvpResponseCardList } from "./rsvp-response-card-list";
import { RsvpResponsesEmptyState } from "./rsvp-responses-empty-state";
import { RsvpResponsesFilterRail } from "./rsvp-responses-filter-rail";
import {
  hasResponseMessage,
  matchesResponseSearch,
  type RsvpResponseRecord,
  type RsvpResponsesTab,
} from "./rsvp-responses-types";

type RsvpResponsesTableProps = {
  activeTab: RsvpResponsesTab;
  hasResponses: boolean;
  isModerating: boolean;
  onActiveTabChange: (value: RsvpResponsesTab) => void;
  onExportClick: () => void;
  onGuestbookModeration: (mode: "approve" | "remove", responseIds: string[]) => void;
  onOpenResponse: (response: RsvpResponseRecord) => void;
  onRejectResponses: (responseIds: string[]) => void;
  onRestoreResponses: (responseIds: string[]) => void;
  pendingResponseIds: string[];
  responses: RsvpResponseRecord[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
};

export function RsvpResponsesTable({
  activeTab,
  hasResponses,
  isModerating,
  onActiveTabChange,
  onExportClick,
  onGuestbookModeration,
  onOpenResponse,
  onRejectResponses,
  onRestoreResponses,
  pendingResponseIds,
  responses,
  searchQuery,
  setSearchQuery,
}: RsvpResponsesTableProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const pendingResponseIdSet = useMemo(() => new Set(pendingResponseIds), [pendingResponseIds]);

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
    setRowSelection({});
  }, [activeTab, searchQuery]);

  const columns = useMemo(
    () =>
      getRsvpResponseColumns({
        isModerating,
        onOpenResponse,
        onRemoveFromGuestbook: (responseId) => onGuestbookModeration("remove", [responseId]),
        onShowInGuestbook: (responseId) => onGuestbookModeration("approve", [responseId]),
        pendingResponseIds: pendingResponseIdSet,
      }),
    [isModerating, onGuestbookModeration, onOpenResponse, pendingResponseIdSet],
  );

  // TanStack Table exposes an instance API that React Compiler intentionally flags.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data: responses,
    state: {
      globalFilter: searchQuery,
      pagination,
      rowSelection,
    },
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
    globalFilterFn: (row, _columnId, filterValue) =>
      matchesResponseSearch(row.original, String(filterValue ?? "")),
  });

  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const pageRows = table.getRowModel().rows;
  const selectedResponses = table.getSelectedRowModel().rows.map((row) => row.original);
  const selectedEligibleResponses = selectedResponses.filter((response) =>
    hasResponseMessage(response),
  );
  const allEligibleSelectedAreApproved =
    selectedEligibleResponses.length > 0 &&
    selectedEligibleResponses.every((response) => response.messagePublicStatus === "approved");
  const hasMixedGuestbookSelection =
    selectedEligibleResponses.some((response) => response.messagePublicStatus === "approved") &&
    selectedEligibleResponses.some((response) => response.messagePublicStatus !== "approved");
  const hasEligibleSelection = selectedEligibleResponses.length > 0;
  const totalRows = filteredRowCount;
  const firstItem = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const lastItem =
    totalRows === 0 ? 0 : Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows);
  const showGuestbookHelper = activeTab === "guestbook" || activeTab === "needs_review";
  const emptyVariant = getEmptyVariant({
    activeTab,
    hasResponses,
    searchQuery,
  });

  return (
    <Card className="gap-0 overflow-hidden rounded-[1.6rem] border border-[#eadbd0] bg-white/80 p-0 shadow-sm shadow-[#8a4b2e]/5">
      <div className="border-b border-[#eadbd0] bg-white/70 p-4">
        <RsvpResponsesFilterRail activeTab={activeTab} onActiveTabChange={onActiveTabChange} />

        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#a88d7f]"
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

          <Button
            type="button"
            variant="outline"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#e7d7ca] bg-white px-4 text-sm font-semibold text-[#3b342f] hover:bg-[#fff8f3] xl:w-auto"
            onClick={onExportClick}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export
          </Button>
        </div>

        {showGuestbookHelper ? (
          <p className="mt-3 text-xs font-medium text-[#8a7c72]">
            Guestbook shows approved messages. Review pending messages before showing them publicly.
          </p>
        ) : null}
      </div>

      {!hasResponses || filteredRowCount === 0 ? (
        <div className="px-6 py-8">
          <RsvpResponsesEmptyState variant={emptyVariant} />
        </div>
      ) : (
        <>
          {selectedResponses.length > 0 ? (
            <div className="flex flex-col gap-3 border-b border-[#eadbd0] bg-[#fffaf6] px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#2b2521]">
                  {selectedResponses.length} selected
                </p>
                {hasMixedGuestbookSelection && allEligibleSelectedAreApproved === false ? (
                  <p className="text-xs font-medium text-[#8a7c72]">
                    Only messages not yet shown will be added.
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                {selectedResponses.some((r) => r.reviewStatus === "approved") && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isModerating}
                    variant="outline"
                    className="w-full rounded-xl border-rose-200 px-3 text-rose-600 hover:bg-rose-50 hover:text-rose-700 sm:w-auto"
                    onClick={() => {
                      const idsToReject = selectedResponses
                        .filter((r) => r.reviewStatus === "approved")
                        .map((r) => r.id);
                      if (onRejectResponses) onRejectResponses(idsToReject);
                    }}
                  >
                    Reject selected
                  </Button>
                )}

                {selectedResponses.some((r) => r.reviewStatus === "rejected") && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isModerating}
                    variant="default"
                    className="w-full rounded-xl px-3 sm:w-auto"
                    onClick={() => {
                      const idsToRestore = selectedResponses
                        .filter((r) => r.reviewStatus === "rejected")
                        .map((r) => r.id);
                      if (onRestoreResponses) onRestoreResponses(idsToRestore);
                    }}
                  >
                    Restore selected
                  </Button>
                )}

                {hasEligibleSelection &&
                selectedResponses.every((r) => r.reviewStatus === "approved") ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isModerating}
                    variant={allEligibleSelectedAreApproved ? "outline" : "default"}
                    className={cn(
                      "w-full rounded-xl px-3 sm:w-auto",
                      allEligibleSelectedAreApproved
                        ? "border border-[#efd5ce] bg-white text-[#8a4f43] hover:bg-[#fff6f2]"
                        : "bg-[#cf734e] text-white hover:bg-[#b85f3c]",
                    )}
                    onClick={() =>
                      onGuestbookModeration(
                        allEligibleSelectedAreApproved ? "remove" : "approve",
                        selectedResponses
                          .filter((r) => r.reviewStatus === "approved")
                          .map((response) => response.id),
                      )
                    }
                  >
                    {allEligibleSelectedAreApproved ? (
                      <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <MessageCircleHeart className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {allEligibleSelectedAreApproved ? "Remove from Guestbook" : "Show in Guestbook"}
                  </Button>
                ) : null}

                <div className="hidden h-4 w-px bg-[#eadbd0] sm:block" />

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full rounded-xl text-[#776b62] hover:bg-[#f8eee7] hover:text-[#3b342f] sm:w-auto"
                  onClick={() => table.resetRowSelection()}
                >
                  Clear
                </Button>
              </div>
            </div>
          ) : null}

          <div className="px-4 py-4 xl:hidden">
            <RsvpResponseCardList
              isModerating={isModerating}
              onOpenResponse={onOpenResponse}
              onRemoveFromGuestbook={(responseId) => onGuestbookModeration("remove", [responseId])}
              onShowInGuestbook={(responseId) => onGuestbookModeration("approve", [responseId])}
              pendingResponseIds={pendingResponseIdSet}
              rows={pageRows}
            />
          </div>

          <div className="hidden xl:block">
            <Table className="w-full min-w-[980px] border-0 text-left text-sm">
              <TableHeader className="bg-[#fffaf6] text-xs tracking-[0.14em] text-[#9a8b80] uppercase">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="border-b border-[#eadbd0] bg-[#fffaf6] transition-none hover:bg-[#fffaf6]"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={cn(
                          "h-auto px-5 py-4 font-bold text-[#9a8b80]",
                          header.id === "action" && "text-right",
                          header.id === "select" && "w-12 px-4",
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
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "border-0 px-5 py-4 align-middle",
                          cell.column.id === "select" && "px-4",
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <div className="border-t border-[#eadbd0] bg-white/70 px-5 py-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <p className="text-sm font-medium text-[#8a7c72]">
            Showing{" "}
            <span className="font-bold text-[#2b2521]">
              {firstItem}–{lastItem}
            </span>{" "}
            of {totalRows} responses
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between xl:justify-end">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
                <SelectTrigger className="h-9 w-full rounded-xl border border-[#eadbd0] bg-white px-3 text-sm font-bold text-[#2b2521] outline-none focus:border-[#d9896c] focus:ring-4 focus:ring-[#d9896c]/10 sm:w-[88px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={8}
                  align="end"
                  className="z-[80] rounded-[20px] border border-[#eadbd0] bg-[#fffaf6] p-1 text-[#2b2521] shadow-lg ring-0 shadow-[#2b2521]/10"
                >
                  <SelectItem
                    className="rounded-[14px] px-3 py-2 text-sm font-medium focus:bg-[#fff0e8] focus:text-[#c96f4c]"
                    value="5"
                  >
                    5
                  </SelectItem>
                  <SelectItem
                    className="rounded-[14px] px-3 py-2 text-sm font-medium focus:bg-[#fff0e8] focus:text-[#c96f4c]"
                    value="10"
                  >
                    10
                  </SelectItem>
                  <SelectItem
                    className="rounded-[14px] px-3 py-2 text-sm font-medium focus:bg-[#fff0e8] focus:text-[#c96f4c]"
                    value="25"
                  >
                    25
                  </SelectItem>
                  <SelectItem
                    className="rounded-[14px] px-3 py-2 text-sm font-medium focus:bg-[#fff0e8] focus:text-[#c96f4c]"
                    value="50"
                  >
                    50
                  </SelectItem>
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
      </div>
    </Card>
  );
}

function getEmptyVariant({
  activeTab,
  hasResponses,
  searchQuery,
}: {
  activeTab: RsvpResponsesTab;
  hasResponses: boolean;
  searchQuery: string;
}) {
  if (!hasResponses) {
    return "empty" as const;
  }

  if (searchQuery.trim()) {
    return "no-results" as const;
  }

  if (activeTab === "messages") {
    return "messages-empty" as const;
  }

  if (activeTab === "guestbook") {
    return "guestbook-empty" as const;
  }

  if (activeTab === "needs_review") {
    return "needs-review-empty" as const;
  }

  return "no-results" as const;
}
