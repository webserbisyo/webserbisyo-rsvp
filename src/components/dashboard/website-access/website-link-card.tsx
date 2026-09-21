"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, ExternalLink, Lock, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/index";

type WebsiteLinkCardProps = {
  canCopy: boolean;
  hasSlugChange: boolean;
  isSlugLocked: boolean;
  isUpdating?: boolean;
  onChangeUrl: () => void;
  onCopy: () => void;
  onDraftSlugInput: (value: string) => void;
  slugDraft: string;
  slugDraftError: string | null;
  subdomainBaseDomain: string;
  subdomainConfigured: boolean;
  websiteUrlFallback: string;
  websiteUrlDraft: string;
  websiteUrlPublished: string;
  websiteUrlProduction?: string;
};

export function WebsiteLinkCard({
  canCopy,
  hasSlugChange,
  isSlugLocked,
  isUpdating = false,
  onChangeUrl,
  onCopy,
  onDraftSlugInput,
  slugDraft,
  slugDraftError,
  subdomainBaseDomain,
  websiteUrlFallback,
  websiteUrlDraft,
  websiteUrlPublished,
}: WebsiteLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const displayUrl = websiteUrlPublished || websiteUrlDraft || websiteUrlFallback;

  async function handleCopy() {
    if (!canCopy || isUpdating || !displayUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(displayUrl);
      setCopied(true);
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
      toast.success("Website link copied to clipboard");
    } catch {
      toast.error("Could not copy the link.");
    }
  }

  return (
    <section className="rounded-[1.75rem] border border-[#EADBD0] bg-white/95 shadow-sm shadow-[#8a4b2e]/5">
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-bold tracking-tight text-[#2D1F1A] sm:text-lg">
            Your Website Link
          </h2>
          <p className="text-xs font-medium text-[#704D5B] sm:text-sm">
            Copy your live link or share it directly with guests
          </p>
        </div>

        {/* Consolidated High-Contrast Link Bar */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* Display URL Box */}
          <div className="flex h-12 flex-1 min-w-0 items-center overflow-hidden rounded-xl border-2 border-[#EADBD0] bg-[#FFFDFC] px-4 font-mono text-sm font-semibold text-[#2D1F1A] select-all focus-within:border-[#C96B48] sm:h-13 sm:text-base">
            <span className="block min-w-0 truncate">{displayUrl}</span>
          </div>

          {/* Action Group */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Copy Link Button */}
            <Button
              type="button"
              disabled={isUpdating || !canCopy}
              onClick={handleCopy}
              aria-label="Copy website link"
              className={cn(
                "h-10 rounded-xl border px-4 text-xs font-bold shadow-none transition-colors sm:h-11 sm:text-sm",
                copied
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  : "border-[#EADBD0] bg-[#FFF7F3] text-[#A7583C] hover:bg-[#FFEFE8]",
              )}
            >
              {copied ? (
                <>
                  <Check className="mr-1.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  Copy link
                </>
              )}
            </Button>

            {/* Share Button */}
            <Button
              type="button"
              disabled={isUpdating || !canCopy}
              onClick={onCopy}
              aria-label="Share website link"
              className="h-10 rounded-xl border border-[#EADBD0] bg-[#FFF7F3] px-4 text-xs font-bold text-[#A7583C] shadow-none hover:bg-[#FFEFE8] sm:h-11 sm:text-sm"
            >
              <Share2 className="mr-1.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Share
            </Button>

            {/* Open Link in New Tab */}
            <Button
              asChild
              variant="outline"
              size="icon"
              disabled={isUpdating || !canCopy}
              className="h-10 w-10 shrink-0 rounded-xl border border-[#EADBD0] bg-[#FFF7F3] text-[#A7583C] hover:bg-[#FFEFE8] sm:h-11 sm:w-11"
            >
              <a
                href={displayUrl || "#"}
                target="_blank"
                rel="noreferrer"
                aria-label="Open website in new tab"
                className={cn((isUpdating || !canCopy) && "pointer-events-none opacity-50")}
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>

        {/* Subdomain Slug Row directly beneath */}
        <div className="mt-4 border-t border-[#F0E4DC] pt-4">
          {isSlugLocked ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Lock className="h-3.5 w-3.5 shrink-0 text-[#A38376]" aria-hidden="true" />
                <span className="text-xs font-bold text-[#704D5B] sm:text-sm">Subdomain:</span>
                <span className="font-mono text-xs font-bold text-[#2D1F1A] sm:text-sm">
                  {slugDraft || "fallback-only"}
                  {subdomainBaseDomain ? `.${subdomainBaseDomain}` : ""}
                </span>
                {hasSlugChange && (
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                    Pending publish
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUpdating}
                onClick={onChangeUrl}
                className="rounded-lg border-[#EADBD0] text-xs font-bold text-[#A86F2A] hover:bg-[#F4EBEB] sm:text-sm"
              >
                Change subdomain
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <label
                  htmlFor="website-slug-preview"
                  className="text-xs font-bold text-[#704D5B] sm:text-sm"
                >
                  Subdomain:
                </label>
                <span className="text-xs font-medium text-[#A38376]">
                  {hasSlugChange
                    ? "Subdomain change pending. Publish to apply."
                    : "Editable before your first publish."}
                </span>
              </div>
              <div className="flex h-11 items-center gap-2 rounded-xl border-2 border-[#EADBD0] bg-[#FFFDFC] px-3.5 font-mono text-sm font-semibold text-[#2D1F1A] focus-within:border-[#C96B48]">
                <Input
                  id="website-slug-preview"
                  value={slugDraft}
                  disabled={isUpdating}
                  aria-invalid={slugDraftError ? "true" : "false"}
                  onChange={(event) => onDraftSlugInput(event.target.value)}
                  placeholder="your-name"
                  className="h-auto border-0 bg-transparent px-0 py-0 text-sm font-semibold text-[#2D1F1A] shadow-none focus-visible:ring-0"
                />
                <span className="ml-auto shrink-0 text-xs font-medium text-[#A38376]">
                  .{subdomainBaseDomain}
                </span>
              </div>
              {slugDraftError && (
                <p className="text-xs font-semibold text-[#A86F2A] sm:text-sm">{slugDraftError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
