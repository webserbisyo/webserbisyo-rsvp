"use client";

import { CheckCircle2, Clock3, EyeOff, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/index";
import type { PublishStatusState } from "./website-access-types";

type PublishStatusCardProps = {
  changesSummary: string;
  disabled?: boolean;
  hasPendingChanges: boolean;
  isPublished: boolean;
  lastEditedLabel: string;
  onPublish: () => void;
  onUnpublish: () => void;
  publishState: PublishStatusState;
  publishedAtLabel: string;
};

export function PublishStatusCard({
  changesSummary,
  disabled = false,
  hasPendingChanges,
  isPublished,
  lastEditedLabel,
  onPublish,
  onUnpublish,
  publishState,
  publishedAtLabel,
}: PublishStatusCardProps) {
  const statusLabel =
    publishState === "up_to_date"
      ? "Up to date"
      : publishState === "needs_publish"
        ? "Needs publish"
        : "Hidden";

  const statusPill = (() => {
    if (publishState === "up_to_date") {
      return { bg: "bg-[#E8F2EC]", color: "text-[#4E8366]" };
    }

    if (publishState === "needs_publish") {
      return { bg: "bg-amber-50", color: "text-amber-800" };
    }

    return { bg: "bg-[#FFF0D9]", color: "text-[#A86F2A]" };
  })();

  const getChangesValue = () => {
    if (!isPublished) return "Draft ready to publish";
    if (!hasPendingChanges) return "No pending changes.";
    return changesSummary;
  };

  const rows = [
    {
      icon: Clock3,
      label: "Last edited",
      value: lastEditedLabel,
      valueColor: "text-[#2D1F1A]",
    },
    {
      icon: isPublished ? CheckCircle2 : EyeOff,
      label: "Published",
      value: isPublished ? publishedAtLabel : "Not live right now",
      valueColor: isPublished ? "text-[#2D1F1A]" : "text-[#A86F2A]",
    },
    {
      icon: isPublished ? CheckCircle2 : EyeOff,
      label: "Website page",
      value: isPublished ? "WebSerbisyo · Active" : "Hidden from guests",
      valueColor: isPublished ? "text-[#4E8366]" : "text-[#A86F2A]",
    },
    {
      icon: CheckCircle2,
      label: "Changes",
      value: getChangesValue(),
      valueColor: !isPublished
        ? "text-[#A86F2A]"
        : !hasPendingChanges
          ? "text-[#4E8366]"
          : "text-[#A86F2A]",
    },
  ];

  return (
    <section className="rounded-[1.75rem] border border-[#eadbd0] bg-white/90 shadow-sm shadow-[#8a4b2e]/5">
      <div className="p-5 sm:p-6">
        {/* Header: title + status pill */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-[#2D1F1A]">Publish Status</h2>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold",
              statusPill.bg,
              statusPill.color,
            )}
          >
            <span aria-hidden="true">•</span> {statusLabel}
          </span>
        </div>

        {/* Status rows — warm rounded horizontal rows */}
        <div className="grid gap-3">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-xl bg-[#FEFAF7] px-4 py-3"
              >
                <span className="flex items-center gap-2.5 text-sm text-[#A38376]">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {row.label}
                </span>
                <span
                  className={cn(
                    "min-w-0 max-w-[58%] text-right text-sm font-medium break-words",
                    row.valueColor,
                  )}
                >
                  {row.value}
                </span>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {publishState === "up_to_date" ? (
            <>
              <Button
                type="button"
                disabled
                className="h-10 flex-1 rounded-xl border border-dashed border-[#e9dcd2] bg-transparent px-4 text-sm font-semibold text-[#A38376] shadow-none"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                No changes to publish
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={onUnpublish}
                className="h-10 rounded-xl border-[#e7d7ca] bg-white px-4 text-sm font-semibold text-[#c96f4c] hover:bg-[#fff8f3]"
              >
                <EyeOff className="h-4 w-4" aria-hidden="true" />
                Unpublish
              </Button>
            </>
          ) : publishState === "needs_publish" ? (
            <>
              <Button
                type="button"
                disabled={disabled}
                onClick={onPublish}
                className="h-11 flex-1 rounded-2xl bg-[#c96f4c] px-5 text-sm font-semibold text-white shadow-sm shadow-[#c96f4c]/20 hover:bg-[#b96143] sm:h-10 sm:rounded-xl sm:px-4"
              >
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                Publish latest changes
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={onUnpublish}
                className="h-10 rounded-xl border-[#e7d7ca] bg-white px-4 text-sm font-semibold text-[#c96f4c] hover:bg-[#fff8f3]"
              >
                <EyeOff className="h-4 w-4" aria-hidden="true" />
                Unpublish
              </Button>
            </>
          ) : (
              <Button
                type="button"
                disabled={disabled}
                onClick={onPublish}
                className="h-11 w-full rounded-2xl bg-[#c96f4c] px-5 text-sm font-semibold text-white shadow-sm shadow-[#c96f4c]/20 hover:bg-[#b96143] sm:h-10 sm:rounded-xl sm:px-4"
              >
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              Publish website
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
