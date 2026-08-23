"use client";

import { useDashboardSettingsQuery } from "@/lib/dashboard/dashboard-queries";
import { resolveMessengerUrl } from "@/lib/apply/messenger";
import { MessageCircle, ArrowRight, ArrowUpRight, Palette, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CustomPreviewPlaceholderProps {
  onSwitchToPlatform?: () => void;
}

export function CustomPreviewPlaceholder({
  onSwitchToPlatform,
}: CustomPreviewPlaceholderProps) {
  const settingsQuery = useDashboardSettingsQuery();
  const messengerUrl = resolveMessengerUrl(settingsQuery.data?.support?.messengerUrl);

  return (
    <div className="flex min-h-[580px] w-full flex-col items-center justify-center p-6 text-center">
      {/* 2D Animated Wireframe Stage */}
      <div className="relative mb-6 w-full max-w-[280px] rounded-2xl border border-stone-200 bg-white p-4 shadow-lg shadow-stone-200/50">
        {/* Mock Browser Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-rose-400" />
            <div className="size-2.5 rounded-full bg-amber-400" />
            <div className="size-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 font-mono text-[9px] text-stone-500">
            custom.webserbisyo.com
          </span>
        </div>

        {/* Animated Skeleton Blocks */}
        <div className="mt-4 space-y-3">
          {/* Hero Banner Shimmer */}
          <div className="relative h-16 w-full overflow-hidden rounded-xl bg-gradient-to-r from-stone-100 via-amber-50 to-stone-100">
            <div className="flex h-full items-center justify-center">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-amber-800/80">
                <Sparkles className="size-3.5 animate-spin" />
                Designing Hero & Monogram
              </span>
            </div>
          </div>

          {/* Grid Layout Placeholders */}
          <div className="grid grid-cols-2 gap-2">
            <div className="h-10 animate-pulse rounded-lg bg-stone-100" />
            <div className="h-10 animate-pulse rounded-lg bg-stone-100 [animation-delay:200ms]" />
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50 p-2">
            <div className="flex items-center gap-1.5">
              <Palette className="size-3.5 text-stone-400" />
              <div className="h-2 w-12 animate-pulse rounded-full bg-stone-200" />
            </div>
            <span className="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">
              Styling Active
            </span>
          </div>
        </div>

        {/* Floating Brand Tool Badge */}
        <div className="absolute -bottom-3 -right-2 flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1 shadow-md">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[10px] font-bold text-stone-800">WebSerbisyo Design</span>
        </div>
      </div>

      {/* Status Badge */}
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/60 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
        Custom Design in Progress
      </span>

      {/* Main Copy */}
      <h3 className="mt-3 text-lg font-bold text-stone-900 sm:text-xl">
        Your Custom Website is Being Designed
      </h3>
      <p className="mt-1.5 max-w-xs text-xs text-stone-600 sm:text-sm">
        The WebSerbisyo team is actively customizing your layout, colors, and motion transitions to match your event theme.
      </p>

      {/* 3-Step Status Tracker */}
      <div className="mt-5 w-full max-w-xs space-y-1.5 rounded-xl border border-stone-200/80 bg-stone-50/60 p-3 text-left">
        <div className="flex items-center gap-2 text-xs text-stone-700">
          <Check className="size-3.5 text-emerald-600" />
          <span className="font-medium">Event Details Received</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-amber-900">
          <span className="ml-1 mr-0.5 size-1.5 animate-ping rounded-full bg-amber-500" />
          <span className="font-semibold text-amber-800">Custom Layout & Styling Active</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <span className="ml-0.5 mr-0.5 flex size-3.5 items-center justify-center rounded-full border border-stone-300 text-[9px]">
            3
          </span>
          <span>Live Preview Cutover</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 flex w-full max-w-xs flex-col gap-2 sm:flex-row">
        {onSwitchToPlatform ? (
          <Button
            className="flex-1 text-xs text-stone-700 hover:bg-stone-100"
            onClick={onSwitchToPlatform}
            size="sm"
            variant="outline"
          >
            View Standard
            <ArrowRight className="ml-1 size-3.5" />
          </Button>
        ) : null}
        <Button
          asChild
          className="flex-1 bg-[#0084FF] text-xs font-medium text-white shadow-sm hover:bg-[#0074E4]"
          size="sm"
        >
          <a href={messengerUrl} target="_blank" rel="noreferrer">
            <MessageCircle className="mr-1.5 size-3.5" />
            Message Us
            <ArrowUpRight className="ml-0.5 size-3" />
          </a>
        </Button>
      </div>
    </div>
  );
}
