"use client";

import {
  CheckCircle2,
  ExternalLink,
  Mail,
  MessageCircle,
  Phone,
  Users,
  Utensils,
  XCircle,
  X,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import {
  formatResponseSubmittedAt,
  getResponseInitials,
  getResponseSourceLabel,
  type RsvpResponseRecord,
} from "./rsvp-responses-types";

type RsvpResponseDetailDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  response: RsvpResponseRecord | null;
};

function StatusChip({
  reviewStatus,
  status,
}: {
  reviewStatus?: "approved" | "rejected";
  status: "attending" | "not_attending";
}) {
  if (reviewStatus === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600 ring-1 ring-stone-200">
        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
        Rejected
      </span>
    );
  }

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

export function RsvpResponseDetailDialog({
  onOpenChange,
  onRejectResponse,
  onRestoreResponse,
  open,
  response,
}: RsvpResponseDetailDialogProps & {
  onRejectResponse?: (responseId: string) => void;
  onRestoreResponse?: (responseId: string) => void;
}) {
  const isMobile = useIsMobile();

  if (!response) {
    return null;
  }

  const content = (
    <RsvpResponseDetailContent
      onClose={() => onOpenChange(false)}
      onRejectResponse={onRejectResponse}
      onRestoreResponse={onRestoreResponse}
      response={response}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90dvh] overflow-hidden rounded-t-[1.75rem] border border-[#eadbd0] bg-[#fffaf6] shadow-2xl">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Guest response</DrawerTitle>
            <DrawerDescription>Response details for {response.guestName}</DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[86dvh] w-[calc(100vw-2rem)] max-w-none flex-col overflow-hidden rounded-[1.75rem] border border-[#eadbd0] bg-[#fffaf6] p-0 shadow-2xl ring-0 shadow-[#2b2521]/20 sm:max-w-[960px] lg:max-w-[960px]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Guest response</DialogTitle>
          <DialogDescription>Response details for {response.guestName}</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

function ModalInfo({
  icon: Icon,
  label,
  value,
  scrollableValue,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  scrollableValue?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl border border-[#efe3da] bg-[#fffdfb] px-3 py-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fff0e8] text-[#c96f4c]">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="max-w-full min-w-0 flex-1">
        <p className="text-[10px] font-bold tracking-[0.16em] text-[#a88d7f] uppercase">{label}</p>
        {scrollableValue ? (
          <div className="mt-0.5 max-h-[6rem] overflow-x-hidden overflow-y-auto pr-1">
            <p
              className="text-sm leading-relaxed font-semibold [overflow-wrap:anywhere] break-words whitespace-normal text-[#3b342f]"
              title={value}
            >
              {value}
            </p>
          </div>
        ) : (
          <p
            className="mt-0.5 max-w-full min-w-0 text-sm leading-relaxed font-semibold [overflow-wrap:anywhere] break-words whitespace-normal text-[#3b342f]"
            title={value}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

function RsvpResponseDetailContent({
  onClose,
  onRejectResponse,
  onRestoreResponse,
  response,
}: {
  onClose: () => void;
  onRejectResponse?: (responseId: string) => void;
  onRestoreResponse?: (responseId: string) => void;
  response: RsvpResponseRecord;
}) {
  const hasCompanions = response.companions.length > 0;
  const hasDietaryNote = Boolean(response.dietaryNotes && response.dietaryNotes.trim());
  const hasMessage = Boolean(response.message && response.message.trim());
  const isRejected = response.reviewStatus === "rejected";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#eadbd0] bg-white/80 p-5">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fff0e8] text-sm font-bold text-[#c96f4c] ring-1 ring-[#f0d7ca]">
            {getResponseInitials(response.guestName)}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-[11px] font-bold tracking-[0.18em] text-[#a88d7f] uppercase">
              Guest response
            </p>
            <div className="mt-1 max-h-[5rem] overflow-x-hidden overflow-y-auto pr-1">
              <h2
                className="text-xl leading-snug font-bold tracking-tight [overflow-wrap:anywhere] break-words whitespace-normal text-[#2b2521]"
                title={response.guestName}
              >
                {response.guestName}
              </h2>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-start gap-3">
          <div className="hidden text-right sm:block">
            <StatusChip
              reviewStatus={response.reviewStatus}
              status={response.status as "attending" | "not_attending"}
            />
            <p className="mt-2 text-xs font-medium text-[#8a7c72]">
              {formatResponseSubmittedAt(response.submittedAt)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl text-[#776b62] hover:bg-[#f8eee7] hover:text-[#3b342f]"
            aria-label="Close details"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-5">
        <div className="mb-4 flex items-center justify-between gap-3 sm:hidden">
          <StatusChip
            reviewStatus={response.reviewStatus}
            status={response.status as "attending" | "not_attending"}
          />
          <p className="text-xs font-medium text-[#8a7c72]">
            {formatResponseSubmittedAt(response.submittedAt)}
          </p>
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <ModalInfo
            icon={Users}
            label="Party"
            value={`${response.partySize} guest${response.partySize > 1 ? "s" : ""}`}
          />
          <ModalInfo
            icon={ExternalLink}
            label="Source"
            value={getResponseSourceLabel(response.source)}
          />
          <ModalInfo
            icon={Mail}
            label="Email"
            value={response.email ?? "No email"}
            scrollableValue
          />
          <ModalInfo icon={Phone} label="Phone" value={response.phone ?? "No phone"} />
        </div>

        <div className="mt-5 grid gap-4">
          <section className="rounded-2xl border border-[#eadbd0] bg-white/70 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#2b2521]">
              <Users className="h-4 w-4 text-[#c96f4c]" aria-hidden="true" />
              Companions
            </div>
            {hasCompanions ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {response.companions.map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-[#eadbd0] bg-[#fffaf6] px-3 py-1.5 text-xs font-semibold [overflow-wrap:anywhere] [word-break:break-word] text-[#65584f]"
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-[#8a7c72]">No companions added.</p>
            )}
          </section>

          <section className="rounded-2xl border border-[#eadbd0] bg-white/70 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#2b2521]">
              <Utensils className="h-4 w-4 text-[#c96f4c]" aria-hidden="true" />
              Dietary notes
            </div>
            <div className="mt-3 max-h-[7rem] overflow-x-hidden overflow-y-auto">
              <p className="max-w-full text-sm leading-6 [overflow-wrap:anywhere] [word-break:break-word] whitespace-pre-wrap text-[#65584f]">
                {hasDietaryNote ? response.dietaryNotes : "No dietary notes."}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-[#efcfbd] bg-[#fff6ef] p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#2b2521]">
              <MessageCircle className="h-4 w-4 text-[#c96f4c]" aria-hidden="true" />
              Message
            </div>
            <div className="mt-3 max-h-[7.5rem] overflow-x-hidden overflow-y-auto">
              <blockquote className="max-w-full text-sm leading-6 [overflow-wrap:anywhere] [word-break:break-word] whitespace-pre-wrap text-[#65584f]">
                {hasMessage ? `“${response.message}”` : "No message added."}
              </blockquote>
            </div>
          </section>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-center gap-3 border-t border-[#eadbd0] bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
        {isRejected && onRestoreResponse ? (
          <Button
            type="button"
            variant="default"
            className="w-full rounded-xl sm:w-auto sm:min-w-[12rem]"
            onClick={() => onRestoreResponse(response.id)}
          >
            Restore RSVP
          </Button>
        ) : null}
        {!isRejected && onRejectResponse ? (
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 sm:w-auto sm:min-w-[12rem]"
            onClick={() => onRejectResponse(response.id)}
          >
            Reject RSVP
          </Button>
        ) : null}
      </div>
    </div>
  );
}
