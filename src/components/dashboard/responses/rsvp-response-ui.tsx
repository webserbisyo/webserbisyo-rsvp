"use client";

import {
  CheckCircle2,
  Eye,
  MessageCircle,
  MessageCircleHeart,
  ShieldAlert,
  ShieldCheck,
  ShieldMinus,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  hasResponseMessage,
  type RsvpResponseGuestbookStatus,
  type RsvpResponseRecord,
} from "./rsvp-responses-types";

export function RsvpResponseStatusBadge({
  status,
}: {
  status: "attending" | "not_attending";
}) {
  const isAttending = status === "attending";
  const Icon = isAttending ? CheckCircle2 : XCircle;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        isAttending
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-rose-50 text-rose-700 ring-rose-200",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {isAttending ? "Attending" : "Not attending"}
    </span>
  );
}

export function RsvpResponsePartySizeBadge({ partySize }: { partySize: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fbf7f3] px-3 py-1 text-xs font-bold text-[#65584f]">
      <Users className="h-3.5 w-3.5" aria-hidden="true" />
      {partySize}
    </span>
  );
}

export function RsvpResponseMessageBadge({
  response,
  showEmpty = false,
}: {
  response: RsvpResponseRecord;
  showEmpty?: boolean;
}) {
  if (hasResponseMessage(response)) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff0e8] px-3 py-1 text-xs font-bold text-[#c96f4c]">
        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
        Has message
      </span>
    );
  }

  if (!showEmpty) {
    return <span className="text-[#a89b91]">—</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f7f1eb] px-3 py-1 text-xs font-bold text-[#8a7c72]">
      <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
      No message
    </span>
  );
}

export function RsvpResponseGuestbookBadge({
  status,
}: {
  status: RsvpResponseGuestbookStatus;
}) {
  const config = getGuestbookBadgeConfig(status);
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold", config.className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {config.label}
    </span>
  );
}

export function RsvpResponseRowActions({
  actionLabelMode = "compact",
  align = "end",
  isModerating,
  onOpenResponse,
  onRemoveFromGuestbook,
  onShowInGuestbook,
  pendingResponseIds,
  response,
}: {
  actionLabelMode?: "compact" | "full" | "mobile";
  align?: "start" | "end";
  isModerating: boolean;
  onOpenResponse: (response: RsvpResponseRecord) => void;
  onRemoveFromGuestbook: (responseId: string) => void;
  onShowInGuestbook: (responseId: string) => void;
  pendingResponseIds: Set<string>;
  response: RsvpResponseRecord;
}) {
  const hasMessage = hasResponseMessage(response);
  const isShownInGuestbook = response.messagePublicStatus === "approved";
  const isPending = pendingResponseIds.has(response.id);
  const isDisabled = isModerating || isPending;
  const actionLabel =
    actionLabelMode === "full"
      ? isShownInGuestbook
        ? "Remove from Guestbook"
        : "Show in Guestbook"
      : actionLabelMode === "mobile"
        ? isShownInGuestbook
          ? "Remove"
          : "Add"
        : isShownInGuestbook
          ? "Remove"
          : "Add";

  return (
    <div
      className={cn(
        actionLabelMode === "mobile"
          ? "flex flex-nowrap shrink-0 items-center gap-1.5"
          : "flex flex-nowrap shrink-0 items-center gap-2",
        align === "end" ? "justify-end" : "justify-start",
      )}
    >
      {hasMessage ? (
        <Button
          type="button"
          variant={isShownInGuestbook ? "outline" : "default"}
          size="sm"
          disabled={isDisabled}
          title={isShownInGuestbook ? "Remove from Guestbook" : "Add to Guestbook"}
          aria-label={isShownInGuestbook ? "Remove from Guestbook" : "Add to Guestbook"}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold",
            actionLabelMode === "mobile" ? "h-8" : "h-9",
            actionLabelMode === "full" && "min-w-[10.75rem]",
            isShownInGuestbook
              ? "border border-[#efd5ce] bg-white text-[#8a4f43] hover:bg-[#fff6f2]"
              : "bg-[#cf734e] text-white hover:bg-[#b85f3c]",
          )}
          onClick={(event) => {
            event.stopPropagation();

            if (isShownInGuestbook) {
              onRemoveFromGuestbook(response.id);
              return;
            }

            onShowInGuestbook(response.id);
          }}
        >
          {isShownInGuestbook ? (
            actionLabelMode !== "mobile" ? (
              <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
            ) : null
          ) : (
            <MessageCircleHeart className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {actionLabel}
        </Button>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        title="View response details"
        aria-label="View response details"
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#e7d7ca] bg-white px-3 text-xs font-semibold text-[#3b342f] hover:bg-[#fff8f3]",
          actionLabelMode === "mobile" ? "h-8" : "h-9",
          actionLabelMode === "full" && "min-w-[6.5rem]",
        )}
        onClick={(event) => {
          event.stopPropagation();
          onOpenResponse(response);
        }}
      >
        {actionLabelMode !== "mobile" ? (
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        ) : null}
        View
      </Button>
    </div>
  );
}

function getGuestbookBadgeConfig(status: RsvpResponseGuestbookStatus) {
  switch (status) {
    case "approved":
      return {
        className: "bg-[#fff2ea] text-[#b85a39]",
        icon: ShieldCheck,
        label: "In Guestbook",
      };
    case "pending_review":
      return {
        className: "bg-amber-50 text-amber-700",
        icon: ShieldAlert,
        label: "Needs review",
      };
    case "hidden":
      return {
        className: "bg-[#f5f0eb] text-[#7a6b61]",
        icon: ShieldMinus,
        label: "Hidden",
      };
    default:
      return {
        className: "bg-[#f5f0eb] text-[#7a6b61]",
        icon: ShieldMinus,
        label: "Private",
      };
  }
}
