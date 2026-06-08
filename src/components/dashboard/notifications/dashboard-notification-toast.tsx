"use client";

import type { ReactNode } from "react";
import { BellRing, MessageCircleMore, ReceiptText, UserRoundCheck } from "lucide-react";

type DashboardNotificationToastVariant = "billing" | "guest_message" | "rsvp";

type DashboardNotificationToastProps = {
  body: string;
  ctaLabel: string;
  onAction: () => void;
  title: string;
  variant: DashboardNotificationToastVariant;
};

export function DashboardNotificationToast({
  body,
  ctaLabel,
  onAction,
  title,
  variant,
}: DashboardNotificationToastProps) {
  return (
    <div className="flex w-[min(calc(100vw-2rem),24rem)] items-center gap-3 rounded-2xl border border-[#ead8c8] bg-[#fffaf4] p-2.5 shadow-[0_8px_30px_rgba(57,38,27,0.12)]">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.85rem] border border-[#e7d4c6] bg-[#fff1e7] text-[color:var(--dash-brand)] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]"
        aria-hidden="true"
      >
        {getVariantIcon(variant)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.875rem] font-semibold text-[#191311]">
          {body}
        </p>
      </div>

      <button
        type="button"
        onClick={onAction}
        className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-xl border border-[#d66f49] bg-[#d66f49] px-3 text-xs font-black text-white shadow-[0_4px_12px_rgba(198,90,55,0.22)] transition hover:bg-[#c66240] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d66f49]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffaf4]"
        aria-label={`${ctaLabel}: ${title}`}
      >
        {ctaLabel}
      </button>
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
