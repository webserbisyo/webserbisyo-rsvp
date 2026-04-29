"use client";

import { flexRender, type Table as TanStackTable } from "@tanstack/react-table";
import { EmptyState } from "@/components/feedback/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type EmptyStateConfig = {
  description: string;
  title: string;
};

type ColumnMeta = {
  cellClassName?: string;
  className?: string;
};

type AdminDataTableProps<TData> = {
  colSpan: number;
  emptyState: EmptyStateConfig;
  table: TanStackTable<TData>;
};

export function AdminDataTable<TData>({ colSpan, emptyState, table }: AdminDataTableProps<TData>) {
  return (
    <div className="bg-card overflow-hidden rounded-lg border">
      <Table className="table-fixed">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta as ColumnMeta | undefined;

                return (
                  <TableHead key={header.id} className={meta?.className}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="py-10">
                <EmptyState title={emptyState.title} description={emptyState.description} />
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as ColumnMeta | undefined;

                  return (
                    <TableCell key={cell.id} className={meta?.cellClassName}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
