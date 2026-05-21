"use client";

import { CheckCircle2, Copy, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/index";

type WebsiteLinkCardProps = {
  hasSlugChange: boolean;
  isSlugLocked: boolean;
  isUpdating?: boolean;
  onChangeUrl: () => void;
  onCopy: () => void;
  onDraftSlugInput: (value: string) => void;
  slugDraft: string;
  slugDraftError: string | null;
  websiteUrlDraft: string;
  websiteUrlPublished: string;
};

export function WebsiteLinkCard({
  hasSlugChange,
  isSlugLocked,
  isUpdating = false,
  onChangeUrl,
  onCopy,
  onDraftSlugInput,
  slugDraft,
  slugDraftError,
  websiteUrlDraft,
  websiteUrlPublished,
}: WebsiteLinkCardProps) {
  const displayUrl = isSlugLocked ? websiteUrlPublished : websiteUrlDraft;
  const helperText = hasSlugChange
    ? "URL change pending. Publish latest changes to apply."
    : isSlugLocked
      ? "Locked after first publish. Use change URL only for typos, wrong names, or testing."
      : "You can edit the URL name before your first publish.";

  return (
    <section className="rounded-[1.75rem] border border-[#eadbd0] bg-white/90 shadow-sm shadow-[#8a4b2e]/5">
      <div className="p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-[#2D1F1A]">Your Website Link</h2>
          <p className="text-sm font-medium text-[#A38376]">Copy this link or customize the URL name</p>
        </div>

        <div className="mb-5 grid items-center gap-3 sm:grid-cols-[1fr_auto]">
          <div className="flex h-12 items-center overflow-hidden rounded-xl border border-[#eacdbf] bg-[#FBF4EF] px-4 font-mono text-sm font-medium text-[#2D1F1A]">
            <span className="truncate">{displayUrl}</span>
          </div>
          <Button
            type="button"
            disabled={isUpdating}
            onClick={onCopy}
            aria-label="Copy website link"
            className="h-12 rounded-xl border border-[#eacdbf] bg-[#FFF7F3] px-5 text-sm font-semibold text-[#A7583C] shadow-none hover:bg-[#fff0e8]"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy
          </Button>
        </div>

        <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <label htmlFor="website-slug-preview" className="text-sm font-semibold text-[#A38376]">URL name</label>
          <p className="text-xs font-medium text-[#A38376] sm:text-sm">{helperText}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className={cn(
            "flex h-12 flex-1 items-center gap-2 rounded-xl border px-4 font-mono text-sm font-medium",
            hasSlugChange ? "border-[#F0D2A6] bg-amber-50 text-amber-800" : "border-[#e9dcd2] bg-[#FBF4EF] text-[#6B4B40]",
          )}>
            {isSlugLocked ? (
              <>
                <span className="truncate">{slugDraft}</span>
                <Lock className={cn("ml-auto h-4 w-4 shrink-0", hasSlugChange ? "text-amber-700" : "text-[#A38376]")} aria-hidden="true" />
              </>
            ) : (
              <Input
                id="website-slug-preview"
                value={slugDraft}
                disabled={isUpdating}
                aria-invalid={slugDraftError ? "true" : "false"}
                onChange={(event) => onDraftSlugInput(event.target.value)}
                className="h-auto border-0 bg-transparent px-0 py-0 text-sm font-semibold text-[#2D1F1A] shadow-none focus-visible:ring-0"
              />
            )}
          </div>

          <span className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold whitespace-nowrap",
            hasSlugChange ? "bg-amber-50 text-amber-800" : isSlugLocked ? "bg-[#f1e7df] text-[#A38376]" : "bg-[#FFF4EE] text-[#A7583C]",
          )}>
            {isSlugLocked ? <Lock className="h-3.5 w-3.5" aria-hidden="true" /> : <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
            {hasSlugChange ? "Pending publish" : isSlugLocked ? "Locked after first publish" : "Editable before publish"}
          </span>

          {isSlugLocked && (
            <Button type="button" disabled={isUpdating} onClick={onChangeUrl} className="h-10 rounded-xl border border-[#eacdbf] bg-[#FFF7F3] px-4 text-sm font-semibold text-[#A7583C] shadow-none hover:bg-[#fff0e8]">
              Change URL
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
