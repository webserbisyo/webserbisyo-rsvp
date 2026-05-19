"use client";

import { useState } from "react";
import { Check, Download, FileSpreadsheet, FileText, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import {
  buildRsvpResponsesExportFilename,
  exportRsvpResponses,
  type RsvpResponsesExportMetadata,
} from "./rsvp-responses-export";
import type {
  RsvpResponseRecord,
  RsvpResponsesExportFormat,
  RsvpResponsesExportInclude,
  RsvpResponsesExportRows,
} from "./rsvp-responses-types";

type RsvpResponseExportDialogProps = {
  allResponses: RsvpResponseRecord[];
  allResponsesCount: number;
  currentViewResponses: RsvpResponseRecord[];
  currentViewCount: number;
  eventSlug?: string | null;
  eventTitle?: string | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

const EXPORT_INCLUDES: Array<{ id: RsvpResponsesExportInclude; label: string }> = [
  { id: "contact_details", label: "Contact details" },
  { id: "companions", label: "Companions" },
  { id: "dietary_notes", label: "Dietary notes" },
  { id: "messages", label: "Messages" },
];

export function RsvpResponseExportDialog({
  allResponses,
  allResponsesCount,
  currentViewResponses,
  currentViewCount,
  eventSlug,
  eventTitle,
  onOpenChange,
  open,
}: RsvpResponseExportDialogProps) {
  const isMobile = useIsMobile();
  const [format, setFormat] = useState<RsvpResponsesExportFormat>("csv");
  const [rows, setRows] = useState<RsvpResponsesExportRows>("current_view");
  const [includes, setIncludes] = useState<Record<RsvpResponsesExportInclude, boolean>>({
    contact_details: true,
    companions: true,
    dietary_notes: true,
    messages: true,
  });
  const metadata: RsvpResponsesExportMetadata = {
    eventSlug,
    eventTitle,
  };

  const exportCount = rows === "current_view" ? currentViewCount : allResponsesCount;

  const content = (
    <RsvpResponseExportContent
      allResponsesCount={allResponsesCount}
      currentViewCount={currentViewCount}
      exportCount={exportCount}
      format={format}
      includes={includes}
      metadata={metadata}
      onClose={() => onOpenChange(false)}
      onExport={() => {
        exportRsvpResponses({
          allResponses,
          currentViewResponses,
          format,
          includes,
          metadata,
          rows,
        });
        onOpenChange(false);
      }}
      onFormatChange={setFormat}
      onIncludeToggle={(key, checked) => setIncludes((current) => ({ ...current, [key]: checked }))}
      onRowsChange={setRows}
      rows={rows}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[88vh] rounded-t-[1.75rem] border border-[#eadbd0] bg-[#fffaf6] shadow-2xl">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Download guest list</DrawerTitle>
            <DrawerDescription>Choose an export format and fields.</DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-1rem)] overflow-hidden rounded-[1.75rem] border border-[#eadbd0] bg-[#fffaf6] p-0 shadow-2xl shadow-[#2b2521]/20 ring-0 sm:max-w-xl"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Download guest list</DialogTitle>
          <DialogDescription>Choose an export format and fields.</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

function RsvpResponseExportContent({
  allResponsesCount,
  currentViewCount,
  exportCount,
  format,
  includes,
  metadata,
  onClose,
  onExport,
  onFormatChange,
  onIncludeToggle,
  onRowsChange,
  rows,
}: {
  allResponsesCount: number;
  currentViewCount: number;
  exportCount: number;
  format: RsvpResponsesExportFormat;
  includes: Record<RsvpResponsesExportInclude, boolean>;
  metadata: RsvpResponsesExportMetadata;
  onClose: () => void;
  onExport: () => void;
  onFormatChange: (value: RsvpResponsesExportFormat) => void;
  onIncludeToggle: (key: RsvpResponsesExportInclude, checked: boolean) => void;
  onRowsChange: (value: RsvpResponsesExportRows) => void;
  rows: RsvpResponsesExportRows;
}) {
  const fileName = buildRsvpResponsesExportFilename(metadata, format === "csv" ? "csv" : "pdf");

  const formats = [
    { id: "csv", label: "CSV", note: "Best for spreadsheets", icon: FileSpreadsheet },
    { id: "pdf_summary", label: "PDF summary", note: "Best for sharing", icon: FileText },
  ];

  const scopes = [
    { id: "current_view", label: "Current view", note: `${currentViewCount} filtered responses` },
    { id: "all_responses", label: "All responses", note: `${allResponsesCount} total responses` },
  ];

  return (
    <div className="flex max-h-[88vh] flex-col bg-[#fffaf6] text-[#2b2521]">
      <div className="flex items-start justify-between gap-4 border-b border-[#eadbd0] bg-white/80 p-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a88d7f]">Export responses</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-[#2b2521]">Download guest list</h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-xl text-[#776b62] hover:bg-[#f8eee7] hover:text-[#3b342f]"
          onClick={onClose}
          aria-label="Close export"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="space-y-5 overflow-y-auto p-5">
        <section>
          <p className="mb-2 text-sm font-bold text-[#2b2521]">Format</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {formats.map((item) => {
              const Icon = item.icon;
              const active = format === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onFormatChange(item.id as RsvpResponsesExportFormat)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3 text-left transition",
                    active ? "border-[#d9896c] bg-[#fff0e8]" : "border-[#eadbd0] bg-white hover:bg-[#fff8f3]"
                  )}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#c96f4c] shadow-sm">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-[#2b2521]">{item.label}</span>
                    <span className="block text-xs font-medium text-[#8a7c72]">{item.note}</span>
                  </span>
                  {active && <Check className="h-4 w-4 text-[#c96f4c]" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <p className="mb-2 text-sm font-bold text-[#2b2521]">Rows</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {scopes.map((item) => {
              const active = rows === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onRowsChange(item.id as RsvpResponsesExportRows)}
                  className={cn(
                    "rounded-2xl border p-3 text-left transition",
                    active ? "border-[#d9896c] bg-[#fff0e8]" : "border-[#eadbd0] bg-white hover:bg-[#fff8f3]"
                  )}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span>
                      <span className="block font-bold text-[#2b2521]">{item.label}</span>
                      <span className="block text-xs font-medium text-[#8a7c72]">{item.note}</span>
                    </span>
                    {active && <Check className="h-4 w-4 text-[#c96f4c]" aria-hidden="true" />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <p className="mb-2 text-sm font-bold text-[#2b2521]">Include</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {EXPORT_INCLUDES.map((item) => (
              <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#eadbd0] bg-white px-3 py-2.5 hover:bg-[#fff8f3]">
                <input
                  type="checkbox"
                  checked={includes[item.id]}
                  onChange={(event) => onIncludeToggle(item.id, event.target.checked)}
                  className="h-4 w-4 accent-[#c96f4c]"
                />
                <span className="text-sm font-semibold text-[#3b342f]">{item.label}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="rounded-2xl border border-[#eadbd0] bg-white px-4 py-3 text-sm text-[#65584f]">
          <span className="font-semibold text-[#2b2521]">File:</span> {fileName}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-[#eadbd0] bg-white/70 p-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#e7d7ca] bg-white px-4 text-sm font-semibold text-[#3b342f] hover:bg-[#fff8f3]"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#c96f4c] px-4 text-sm font-semibold text-white shadow-sm shadow-[#c96f4c]/20 hover:bg-[#b96143]"
          onClick={onExport}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export {exportCount} response{exportCount === 1 ? "" : "s"}
        </Button>
      </div>
    </div>
  );
}
