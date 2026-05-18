"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, FileText, XIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { exportRsvpResponses, RSVP_RESPONSES_EXPORT_BASE_FILENAME } from "./rsvp-responses-export";
import { RESPONSES_PORTAL_THEME_STYLE } from "./rsvp-responses-theme";
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

  const exportCount = rows === "current_view" ? currentViewCount : allResponsesCount;

  const content = (
    <RsvpResponseExportContent
      allResponsesCount={allResponsesCount}
      currentViewCount={currentViewCount}
      exportCount={exportCount}
      format={format}
      includes={includes}
      onClose={() => onOpenChange(false)}
      onExport={() => {
        exportRsvpResponses({
          allResponses,
          currentViewResponses,
          format,
          includes,
          rows,
        });
        onOpenChange(false);
      }}
      onFormatChange={setFormat}
      onIncludeToggle={(key, checked) =>
        setIncludes((current) => ({ ...current, [key]: checked }))
      }
      onRowsChange={setRows}
      rows={rows}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          style={RESPONSES_PORTAL_THEME_STYLE}
          className="max-h-[88vh] rounded-t-[28px] border-[color:var(--responses-border)] bg-[var(--responses-surface)] text-[color:var(--responses-foreground)] shadow-[var(--responses-shadow-lg)]"
        >
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
        style={RESPONSES_PORTAL_THEME_STYLE}
        showCloseButton={false}
        className="max-w-[calc(100%-1rem)] overflow-hidden rounded-[30px] border border-[color:var(--responses-border)] bg-[var(--responses-surface)] p-0 text-[color:var(--responses-foreground)] shadow-[var(--responses-shadow-lg)] ring-0 sm:max-w-2xl"
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
  onClose: () => void;
  onExport: () => void;
  onFormatChange: (value: RsvpResponsesExportFormat) => void;
  onIncludeToggle: (key: RsvpResponsesExportInclude, checked: boolean) => void;
  onRowsChange: (value: RsvpResponsesExportRows) => void;
  rows: RsvpResponsesExportRows;
}) {
  const fileName = `${RSVP_RESPONSES_EXPORT_BASE_FILENAME}.${format === "csv" ? "csv" : "pdf"}`;

  return (
    <div className="flex max-h-[88vh] flex-col bg-[var(--responses-surface)] text-[color:var(--responses-foreground)]">
      <div className="sticky top-0 z-10 border-b border-[color:var(--responses-border)] bg-[var(--responses-surface)] px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold tracking-[0.24em] text-[color:var(--responses-heading-muted)] uppercase">
              Export responses
            </p>
            <h2 className="text-xl font-semibold text-[color:var(--responses-foreground)]">Download guest list</h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full text-[color:var(--responses-muted)] hover:bg-[var(--responses-surface-muted)] hover:text-[color:var(--responses-foreground)]"
            aria-label="Close export responses dialog"
            onClick={onClose}
          >
            <XIcon className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="overflow-y-auto px-4 py-4">
        <div className="space-y-5">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-[color:var(--responses-foreground)]">Format</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectableCard
                active={format === "csv"}
                description="Best for spreadsheets"
                icon={<FileSpreadsheet className="size-4" aria-hidden="true" />}
                title="CSV"
                onClick={() => onFormatChange("csv")}
              />
              <SelectableCard
                active={format === "pdf_summary"}
                description="Best for sharing"
                icon={<FileText className="size-4" aria-hidden="true" />}
                title="PDF summary"
                onClick={() => onFormatChange("pdf_summary")}
              />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-[color:var(--responses-foreground)]">Rows</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectableCard
                active={rows === "current_view"}
                description={`${currentViewCount} filtered responses`}
                title="Current view"
                onClick={() => onRowsChange("current_view")}
              />
              <SelectableCard
                active={rows === "all_responses"}
                description={`${allResponsesCount} total responses`}
                title="All responses"
                onClick={() => onRowsChange("all_responses")}
              />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-[color:var(--responses-foreground)]">File preview</h3>
            <div
              className="rounded-[22px] border px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
              style={{
                borderColor: "var(--responses-border)",
                backgroundColor: "var(--responses-surface-muted)",
              }}
            >
              <p className="text-xs font-semibold tracking-[0.16em] text-[color:var(--responses-heading-muted)] uppercase">
                File
              </p>
              <p className="mt-1 text-sm font-medium text-[color:var(--responses-foreground)]">{fileName}</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-[color:var(--responses-foreground)]">Include</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {EXPORT_INCLUDES.map((item) => (
                <label
                  key={item.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-[22px] border px-4 py-3 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]",
                    includes[item.id] && "shadow-[var(--responses-shadow-sm)]",
                  )}
                  style={{
                    borderColor: includes[item.id]
                      ? "color-mix(in srgb, var(--responses-brand) 42%, var(--responses-border))"
                      : "var(--responses-border)",
                    backgroundColor: "var(--responses-surface)",
                  }}
                >
                  <Checkbox
                    className="border-[color:var(--responses-border)] bg-[var(--responses-surface)] data-checked:border-[color:var(--responses-brand)] data-checked:bg-[color:var(--responses-brand)] data-checked:text-white"
                    checked={includes[item.id]}
                    onCheckedChange={(checked) => onIncludeToggle(item.id, checked === true)}
                    aria-label={`Include ${item.label}`}
                  />
                  <span className="text-sm font-medium text-[color:var(--responses-foreground)]">{item.label}</span>
                </label>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="border-t border-[color:var(--responses-border)] bg-[var(--responses-surface-muted)] px-4 py-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="border-[color:var(--responses-border)] bg-[var(--responses-surface)] text-[color:var(--responses-foreground)] hover:bg-[var(--responses-surface)]"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="border border-transparent bg-[color:var(--responses-brand)] text-white shadow-[var(--responses-shadow-sm)] hover:bg-[color:var(--responses-brand-hover,var(--responses-brand-active))]"
            onClick={onExport}
          >
            <Download className="size-4" aria-hidden="true" />
            Export {exportCount} response{exportCount === 1 ? "" : "s"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SelectableCard({
  active,
  description,
  icon,
  onClick,
  title,
}: {
  active: boolean;
  description: string;
  icon?: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "cursor-pointer rounded-[24px] border px-4 py-4 text-left transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]",
        active && "shadow-sm",
      )}
      style={{
        borderColor: active ? "var(--responses-brand)" : "var(--responses-border)",
        backgroundColor: active ? "var(--responses-brand-subtle)" : "var(--responses-surface)",
      }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {icon ? (
            <span
              className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-[18px] border text-[color:var(--responses-brand-active)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_10px_20px_rgba(62,39,23,0.05)]"
              style={{
                borderColor: "color-mix(in srgb, var(--responses-border) 78%, white)",
                backgroundColor: "var(--responses-surface)",
              }}
            >
              {icon}
            </span>
          ) : null}
          <div>
            <p className="font-semibold text-[color:var(--responses-foreground)]">{title}</p>
            <p className="mt-1 text-sm leading-6 text-[color:var(--responses-muted)]">{description}</p>
          </div>
        </div>
        {active ? (
          <span className="shrink-0 text-[color:var(--responses-brand)]">
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </span>
        ) : null}
      </div>
    </button>
  );
}
