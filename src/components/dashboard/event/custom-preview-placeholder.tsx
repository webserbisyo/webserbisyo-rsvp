"use client";

import { Sparkles, CheckCircle2, MessageCircle, ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardSettingsQuery } from "@/lib/dashboard/dashboard-queries";
import { resolveMessengerUrl } from "@/lib/apply/messenger";

interface CustomPreviewPlaceholderProps {
  onSwitchToPlatform?: () => void;
}

export function CustomPreviewPlaceholder({
  onSwitchToPlatform,
}: CustomPreviewPlaceholderProps) {
  const settingsQuery = useDashboardSettingsQuery();
  const messengerUrl = resolveMessengerUrl(settingsQuery.data?.support?.messengerUrl);

  return (
    <div className="relative flex min-h-[560px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-stone-200/80 bg-gradient-to-b from-stone-50/90 via-white to-stone-50/80 p-6 text-center shadow-inner">
      {/* Ambient Dotted Canvas */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Floating Animated Studio Icon */}
      <div className="relative mb-5 flex size-18 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-amber-400/20 duration-1000" />
        <div className="absolute inset-2 animate-pulse rounded-full bg-gradient-to-tr from-amber-200/60 to-orange-100" />
        <div className="relative flex size-12 items-center justify-center rounded-2xl border border-amber-300/80 bg-white shadow-md">
          <Sparkles className="size-6 text-amber-600 animate-pulse" />
        </div>
      </div>

      {/* Status Badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-50/90 px-3.5 py-1 text-xs font-medium text-amber-900 shadow-xs">
        <span className="size-2 animate-pulse rounded-full bg-amber-500" />
        Bespoke Studio in Progress
      </div>

      {/* Main Copy */}
      <h3 className="mt-4 font-serif text-xl font-medium tracking-tight text-stone-900 sm:text-2xl">
        Handcrafting Your Custom Experience
      </h3>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-stone-600 sm:text-sm">
        Our design studio is actively tailoring your typography, personalized layout, and bespoke motion transitions to match your unique event theme.
      </p>

      {/* 3-Step Live Pipeline Tracker */}
      <div className="mt-6 w-full max-w-xs space-y-2 rounded-xl border border-stone-200/70 bg-white/90 p-3.5 text-left shadow-xs backdrop-blur-xs">
        <div className="flex items-center gap-2.5 text-xs text-stone-700">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span className="font-medium text-stone-900">Event Details & Palette Synced</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-amber-900">
          <span className="relative flex size-4 shrink-0 items-center justify-center">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
          </span>
          <span className="font-semibold text-amber-800">Bespoke Layout & Motion Styling</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-stone-400">
          <span className="flex size-4 shrink-0 items-center justify-center rounded-full border border-stone-300 text-[10px]">
            3
          </span>
          <span>Preview Cutover & Live Deployment</span>
        </div>
      </div>

      {/* Interactive Actions */}
      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
        {onSwitchToPlatform ? (
          <Button
            className="text-xs text-stone-700 hover:bg-stone-100"
            onClick={onSwitchToPlatform}
            size="sm"
            variant="outline"
          >
            View Platform Preview
            <ArrowRight className="ml-1.5 size-3.5" />
          </Button>
        ) : null}
        <Button asChild className="bg-stone-900 text-xs text-white hover:bg-stone-800" size="sm">
          <a href={messengerUrl} target="_blank" rel="noreferrer">
            <MessageCircle className="mr-1.5 size-3.5" />
            Message Design Team
            <ArrowUpRight className="ml-1 size-3" />
          </a>
        </Button>
      </div>
    </div>
  );
}
