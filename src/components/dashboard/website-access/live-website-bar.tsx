"use client";

import { ExternalLink, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/index";

type LiveWebsiteBarProps = {
  disabled?: boolean;
  isPublished: boolean;
  onPublish: () => void;
  websiteUrl: string;
};

export function LiveWebsiteBar({
  disabled = false,
  isPublished,
  onPublish,
  websiteUrl,
}: LiveWebsiteBarProps) {
  return (
    <section className="rounded-2xl border border-[#eadbd0] bg-white/90 px-5 py-4 shadow-sm shadow-[#8a4b2e]/5 sm:px-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "inline-block h-3 w-3 rounded-full",
              isPublished
                ? "bg-[#5BA176] shadow-[0_0_0_5px_rgba(91,161,118,0.15)]"
                : "bg-amber-500 shadow-[0_0_0_5px_rgba(245,158,11,0.15)]",
            )}
          />
          <p className="text-base font-semibold tracking-tight text-[#2D1F1A]">
            {isPublished ? "Live website" : "Website hidden"}
          </p>
        </div>

        {isPublished ? (
          <Button
            asChild
            type="button"
            className="h-10 rounded-2xl bg-[#c96f4c] px-5 text-sm font-semibold text-white shadow-sm shadow-[#c96f4c]/20 hover:bg-[#b96143]"
          >
            <a href={websiteUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Open website
            </a>
          </Button>
        ) : (
          <Button
            type="button"
            disabled={disabled}
            onClick={onPublish}
            className="h-10 rounded-2xl bg-[#c96f4c] px-5 text-sm font-semibold text-white shadow-sm shadow-[#c96f4c]/20 hover:bg-[#b96143]"
          >
            <UploadCloud className="h-4 w-4" aria-hidden="true" />
            Publish site
          </Button>
        )}
      </div>
    </section>
  );
}
