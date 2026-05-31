"use client";

import type { ReactNode } from "react";
import { BellRing, ChevronRight, MessageCircleMore, ReceiptText, UserRoundCheck } from "lucide-react";

type DashboardNotificationToastVariant = "billing" | "guest_message" | "rsvp";
type DashboardNotificationToastChipTone = "danger" | "neutral" | "success" | "warning";

export type DashboardNotificationToastChip = {
  label: string;
  tone: DashboardNotificationToastChipTone;
};

type DashboardNotificationToastProps = {
  body: string;
  chips?: DashboardNotificationToastChip[];
  ctaLabel: string;
  onAction: () => void;
  title: string;
  variant: DashboardNotificationToastVariant;
};

const CHIP_TONE_CLASS_NAMES: Record<DashboardNotificationToastChipTone, string> = {
  danger: "border-[#ebc2ba] bg-[#fff1ed] text-[#a34836]",
  neutral: "border-[#e7d7c8] bg-[#fbf4ec] text-[#775f54]",
  success: "border-[#d5e5cd] bg-[#eef7e7] text-[#4f7e3f]",
  warning: "border-[#eed9b5] bg-[#fff5e2] text-[#99663a]",
};

export function DashboardNotificationToast({
  body,
  chips = [],
  ctaLabel,
  onAction,
  title,
  variant,
}: DashboardNotificationToastProps) {
  return (
    <div className="w-[min(calc(100vw-1.5rem),26rem)] rounded-[1.6rem] border border-[#ead8c8] bg-[#fffaf4] p-3 shadow-[0_22px_56px_rgba(57,38,27,0.18)]">
      <div className="flex gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border border-[#e7d4c6] bg-[#fff1e7] text-[color:var(--dash-brand)] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]"
          aria-hidden="true"
        >
          {getVariantIcon(variant)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[0.78rem] font-black uppercase tracking-[0.16em] text-[color:var(--dash-brand)]">
                Dashboard alert
              </p>
              <p className="mt-1 text-[1rem] font-black leading-tight text-[#191311]">{title}</p>
              <p className="mt-1.5 text-sm font-semibold leading-6 text-[#6f5d54]">{body}</p>
            </div>

            <button
              type="button"
              onClick={onAction}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-[1rem] border border-[#d66f49] bg-[#d66f49] px-3.5 text-sm font-black text-white shadow-[0_12px_22px_rgba(198,90,55,0.22)] transition hover:bg-[#c66240] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d66f49]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffaf4]"
              aria-label={`${ctaLabel}: ${title}`}
            >
              {ctaLabel}
              <ChevronRight className="size-4" />
            </button>
          </div>

          {chips.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span
                  key={`${chip.tone}:${chip.label}`}
                  className={`inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-[0.76rem] font-black ${CHIP_TONE_CLASS_NAMES[chip.tone]}`}
                >
                  {chip.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function getVariantIcon(variant: DashboardNotificationToastVariant): ReactNode {
  switch (variant) {
    case "rsvp":
      return <UserRoundCheck className="size-5" />;
    case "guest_message":
      return <MessageCircleMore className="size-5" />;
    case "billing":
      return <ReceiptText className="size-5" />;
    default:
      return <BellRing className="size-5" />;
  }
}
