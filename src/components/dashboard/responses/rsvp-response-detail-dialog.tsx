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

function StatusChip({ status }: { status: "attending" | "not_attending" }) {
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
  open,
  response,
}: RsvpResponseDetailDialogProps) {
  const isMobile = useIsMobile();

  if (!response) {
    return null;
  }

  const content = <RsvpResponseDetailContent onClose={() => onOpenChange(false)} response={response} />;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className="max-h-[90dvh] overflow-hidden rounded-t-[1.75rem] border border-[#eadbd0] bg-[#fffaf6] shadow-2xl"
        >
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
        className="flex max-h-[86dvh] w-[calc(100vw-2rem)] max-w-none flex-col overflow-hidden rounded-[1.75rem] border border-[#eadbd0] bg-[#fffaf6] p-0 shadow-2xl shadow-[#2b2521]/20 ring-0 sm:max-w-[960px] lg:max-w-[960px]"
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
    <div className="flex min-w-0 overflow-hidden items-center gap-3 rounded-2xl border border-[#efe3da] bg-[#fffdfb] px-3 py-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fff0e8] text-[#c96f4c]">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 max-w-full flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a88d7f]">{label}</p>
        {scrollableValue ? (
          <div className="mt-0.5 max-h-[6rem] overflow-y-auto overflow-x-hidden pr-1">
            <p
              className="whitespace-normal break-words text-sm font-semibold leading-relaxed text-[#3b342f] [overflow-wrap:anywhere]"
              title={value}
            >
              {value}
            </p>
          </div>
        ) : (
          <p
            className="mt-0.5 min-w-0 max-w-full whitespace-normal break-words text-sm font-semibold leading-relaxed text-[#3b342f] [overflow-wrap:anywhere]"
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
  response,
}: {
  onClose: () => void;
  response: RsvpResponseRecord;
}) {
  const hasCompanions = response.companions.length > 0;
  const hasDietaryNote = Boolean(response.dietaryNotes && response.dietaryNotes.trim());
  const hasMessage = Boolean(response.message && response.message.trim());

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#eadbd0] bg-white/80 p-5">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fff0e8] text-sm font-bold text-[#c96f4c] ring-1 ring-[#f0d7ca]">
            {getResponseInitials(response.guestName)}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a88d7f]">Guest response</p>
            <div className="mt-1 max-h-[5rem] overflow-y-auto overflow-x-hidden pr-1">
              <h2
                className="whitespace-normal break-words text-xl font-bold leading-snug tracking-tight text-[#2b2521] [overflow-wrap:anywhere]"
                title={response.guestName}
              >
                {response.guestName}
              </h2>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-start gap-3">
          <div className="hidden text-right sm:block">
            <StatusChip status={response.status as "attending" | "not_attending"} />
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

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-5">
        <div className="mb-4 flex items-center justify-between gap-3 sm:hidden">
          <StatusChip status={response.status as "attending" | "not_attending"} />
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
          <ModalInfo
            icon={Phone}
            label="Phone"
            value={response.phone ?? "No phone"}
          />
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
                    className="rounded-full border border-[#eadbd0] bg-[#fffaf6] px-3 py-1.5 text-xs font-semibold text-[#65584f] [overflow-wrap:anywhere] [word-break:break-word]"
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
            <div className="mt-3 max-h-[7rem] overflow-y-auto overflow-x-hidden">
              <p className="max-w-full whitespace-pre-wrap text-sm leading-6 text-[#65584f] [overflow-wrap:anywhere] [word-break:break-word]">
                {hasDietaryNote ? response.dietaryNotes : "No dietary notes."}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-[#efcfbd] bg-[#fff6ef] p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#2b2521]">
              <MessageCircle className="h-4 w-4 text-[#c96f4c]" aria-hidden="true" />
              Message
            </div>
            <div className="mt-3 max-h-[7.5rem] overflow-y-auto overflow-x-hidden">
              <blockquote className="max-w-full whitespace-pre-wrap text-sm leading-6 text-[#65584f] [overflow-wrap:anywhere] [word-break:break-word]">
                {hasMessage ? `“${response.message}”` : "No message added."}
              </blockquote>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
