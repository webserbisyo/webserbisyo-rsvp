"use client";

import { AlertTriangle, Check, CheckCircle2, Globe2, Link2, Lock } from "lucide-react";
import { cn } from "@/lib/utils/index";
import type { VisibilityMode } from "./website-access-types";

type GuestAccessCardProps = {
  disabled?: boolean;
  hasVisibilityDraft: boolean;
  isPublished: boolean;
  onSelect: (mode: VisibilityMode) => void;
  selectedVisibility: VisibilityMode;
  visibilityLabel: string;
};

const VISIBILITY_OPTIONS: Array<{
  description: string;
  disabled?: boolean;
  icon: typeof Link2;
  id: VisibilityMode;
  label: string;
  note?: string;
}> = [
  {
    description: "Only guests with your link can access the site.",
    icon: Link2,
    id: "private",
    label: "Private Link",
  },
  {
    description: "Anyone can find and view your website.",
    icon: Globe2,
    id: "open",
    label: "Open",
  },
  {
    description: "Invite-code access for private events.",
    disabled: true,
    icon: Lock,
    id: "restricted",
    label: "Restricted+",
    note: "Coming soon",
  },
];

export function GuestAccessCard({
  disabled = false,
  hasVisibilityDraft,
  isPublished,
  onSelect,
  selectedVisibility,
  visibilityLabel,
}: GuestAccessCardProps) {
  return (
    <section className="rounded-[1.75rem] border border-[#eadbd0] bg-white/90 shadow-sm shadow-[#8a4b2e]/5">
      <div className="p-5 sm:p-6">
        {/* Header row: title + mode pill */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-[#2D1F1A]">Guest Access</h2>
          <span
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold",
              hasVisibilityDraft
                ? "bg-amber-50 text-amber-800"
                : "bg-[#f1e7df] text-[#A7583C]",
            )}
          >
            {visibilityLabel}
          </span>
        </div>

        {/* Stacked horizontal option rows */}
        <div role="radiogroup" aria-label="Guest access options" className="grid gap-3">
          {VISIBILITY_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedVisibility === option.id;

            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-disabled={option.disabled || disabled ? "true" : undefined}
                disabled={option.disabled || disabled}
                onClick={() => onSelect(option.id)}
                className={cn(
                  "grid items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all",
                  "grid-cols-[2.75rem_1fr_auto]",
                  option.disabled || disabled
                    ? "cursor-default border-[#eadfd5] bg-[#fbf8f5] opacity-60"
                    : "hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#8a4b2e]/8",
                  isSelected && !option.disabled
                    ? "border-[#eacdbf] bg-[#FFF4EE] shadow-sm shadow-[#c96f4c]/8"
                    : !option.disabled
                      ? "border-[#e9dcd2] bg-white"
                      : "",
                )}
              >
                {/* Icon tile */}
                <span
                  className={cn(
                    "grid h-11 w-11 place-items-center rounded-[0.875rem]",
                    isSelected && !option.disabled
                      ? "bg-[#c96f4c] text-white"
                      : "bg-[#f1e7df] text-[#A38376]",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>

                {/* Title + description */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        isSelected && !option.disabled
                          ? "text-[#A7583C]"
                          : "text-[#2D1F1A]",
                      )}
                    >
                      {option.label}
                    </p>
                    {option.note && (
                      <span className="rounded-md bg-[#FBF4EF] px-2 py-0.5 text-[11px] font-medium text-[#B49B90]">
                        {option.note}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm leading-snug text-[#B49B90]">
                    {option.description}
                  </p>
                </div>

                {/* Selected check indicator */}
                {isSelected && !option.disabled ? (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[#c96f4c] text-white">
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </span>
                ) : (
                  <span className="h-7 w-7" />
                )}
              </button>
            );
          })}
        </div>

        {/* Pending / applied notice */}
        <div
          className={cn(
            "mt-4 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium",
            hasVisibilityDraft
              ? "bg-amber-50/90 text-amber-800"
              : "bg-[#FEFAF7] text-[#A38376]",
          )}
        >
          {hasVisibilityDraft ? (
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <p>
            {hasVisibilityDraft
              ? isPublished
                ? "Visibility changed. Publish to update the live website."
                : "Visibility saved for the next publish."
              : "Current access mode is already applied."}
          </p>
        </div>
      </div>
    </section>
  );
}
