"use client";

import type { ReactNode } from "react";

import {
  CheckCircle2,
  ExternalLink,
  Mail,
  MessageCircle,
  Phone,
  Users,
  Utensils,
  XCircle,
  XIcon,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import {
  formatResponseSubmittedAt,
  getResponseInitials,
  getResponseSourceLabel,
  type RsvpResponseRecord,
} from "./rsvp-responses-types";
import { RESPONSES_PORTAL_THEME_STYLE } from "./rsvp-responses-theme";

type RsvpResponseDetailDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  response: RsvpResponseRecord | null;
};

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
          style={RESPONSES_PORTAL_THEME_STYLE}
          className="max-h-[88vh] rounded-t-[28px] border-[color:var(--responses-border)] bg-[var(--responses-surface)] text-[color:var(--responses-foreground)] shadow-[var(--responses-shadow-lg)]"
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
        style={RESPONSES_PORTAL_THEME_STYLE}
        showCloseButton={false}
        className="max-w-[calc(100%-1rem)] overflow-hidden rounded-[30px] border border-[color:var(--responses-border)] bg-[var(--responses-surface)] p-0 text-[color:var(--responses-foreground)] shadow-[var(--responses-shadow-lg)] ring-0 sm:max-w-3xl"
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

function RsvpResponseDetailContent({
  onClose,
  response,
}: {
  onClose: () => void;
  response: RsvpResponseRecord;
}) {
  const isAttending = response.status === "attending";

  return (
    <div className="flex max-h-[88vh] flex-col bg-[var(--responses-surface)] text-[color:var(--responses-foreground)]">
      <div className="sticky top-0 z-10 border-b border-[color:var(--responses-border)] bg-[var(--responses-surface)] px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-[22px] text-lg font-semibold"
              style={{
                backgroundColor: "var(--responses-brand-subtle)",
                color: "var(--responses-brand-active)",
              }}
            >
              {getResponseInitials(response.guestName)}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-[11px] font-semibold tracking-[0.24em] text-[color:var(--responses-heading-muted)] uppercase">
                Guest response
              </p>
              <h2 className="text-xl font-semibold text-[color:var(--responses-foreground)]">
                {response.guestName}
              </h2>
            </div>
          </div>

          <div className="flex shrink-0 items-start gap-3">
            <div className="space-y-2 text-right">
              <Badge
                variant="outline"
                className="rounded-full border px-2.5 py-1 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
                style={{
                  borderColor: isAttending
                    ? "var(--responses-success)"
                    : "var(--responses-destructive)",
                  backgroundColor: isAttending
                    ? "var(--responses-success-subtle)"
                    : "var(--responses-destructive-subtle)",
                  color: isAttending
                    ? "var(--responses-success)"
                    : "var(--responses-destructive)",
                }}
              >
                {isAttending ? (
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                ) : (
                  <XCircle className="size-3.5" aria-hidden="true" />
                )}
                {isAttending ? "Attending" : "Not attending"}
              </Badge>
              <p className="text-xs text-[color:var(--responses-muted)]">
                {formatResponseSubmittedAt(response.submittedAt)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 rounded-full text-[color:var(--responses-muted)] hover:bg-[var(--responses-surface-muted)] hover:text-[color:var(--responses-foreground)]"
              aria-label="Close guest response details"
              onClick={onClose}
            >
              <XIcon className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto px-4 py-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailStat
            label="Party"
            value={`${response.partySize} ${response.partySize === 1 ? "guest" : "guests"}`}
            icon={<Users className="size-4" aria-hidden="true" />}
          />
          <DetailStat
            label="Source"
            value={getResponseSourceLabel(response.source)}
            icon={<ExternalLink className="size-4" aria-hidden="true" />}
          />
          <DetailStat
            label="Email"
            value={response.email ?? "No email added."}
            icon={<Mail className="size-4" aria-hidden="true" />}
          />
          <DetailStat
            label="Phone"
            value={response.phone ?? "No phone added."}
            icon={<Phone className="size-4" aria-hidden="true" />}
          />
        </div>

        <Separator className="my-4 bg-[color:var(--responses-divider)]" />

        <div className="space-y-4">
          <section
            className="rounded-[24px] border px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
            style={{
              borderColor: "color-mix(in srgb, var(--responses-border) 86%, white)",
              backgroundColor: "color-mix(in srgb, var(--responses-surface) 96%, white)",
            }}
          >
            <div className="mb-3 flex items-center gap-3">
              <span
                className="flex size-9 items-center justify-center rounded-[18px] text-[color:var(--responses-brand-active)]"
                style={{ backgroundColor: "var(--responses-brand-subtle)" }}
              >
                <Users className="size-4" aria-hidden="true" />
              </span>
              <span className="text-xs font-semibold tracking-[0.16em] text-[color:var(--responses-heading-muted)] uppercase">
                Companions
              </span>
            </div>
            {response.companions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {response.companions.map((companion) => (
                  <span
                    key={companion}
                    className="inline-flex items-center rounded-full border px-3 py-1 text-sm"
                    style={{
                      borderColor: "var(--responses-border)",
                      backgroundColor: "var(--responses-surface)",
                      color: "var(--responses-foreground)",
                    }}
                  >
                    {companion}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-[color:var(--responses-muted)]">No companions added.</p>
            )}
          </section>

          <section>
            <DetailMessageCard
              icon={<Utensils className="size-4" aria-hidden="true" />}
              title="Dietary notes"
            >
              {response.dietaryNotes ?? "No dietary notes."}
            </DetailMessageCard>
          </section>

          <section>
            <div
              className="rounded-[24px] border px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
              style={{
                borderColor: "color-mix(in srgb, var(--responses-brand) 24%, var(--responses-border))",
                backgroundColor: "var(--responses-brand-subtle)",
                color: "var(--responses-foreground)",
              }}
            >
              <div className="mb-2.5 flex items-center gap-3 text-[color:var(--responses-brand-active)]">
                <span
                  className="flex size-9 items-center justify-center rounded-[18px]"
                  style={{ backgroundColor: "rgba(255,255,255,0.5)" }}
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold tracking-[0.16em] uppercase">Message</span>
              </div>
              <p className="text-sm leading-6">{response.message ?? "No message added."}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function DetailStat({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-[24px] border px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
      style={{
        borderColor: "color-mix(in srgb, var(--responses-border) 86%, white)",
        backgroundColor: "color-mix(in srgb, var(--responses-surface) 96%, white)",
      }}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <span
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[18px] text-[color:var(--responses-brand-active)]"
            style={{ backgroundColor: "var(--responses-brand-subtle)" }}
          >
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[color:var(--responses-heading-muted)] uppercase">
            {label}
          </p>
          <p className="mt-1 min-w-0 break-words text-sm font-medium leading-5 text-[color:var(--responses-foreground)]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailMessageCard({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon?: ReactNode;
  title?: string;
}) {
  return (
    <div
      className="rounded-[24px] border px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
      style={{
        borderColor: "color-mix(in srgb, var(--responses-border) 86%, white)",
        backgroundColor: "color-mix(in srgb, var(--responses-surface) 96%, white)",
        color: "var(--responses-foreground)",
      }}
    >
      {icon ? (
        <div className="mb-2.5 flex items-start gap-3 text-[color:var(--responses-brand-active)]">
          <span
            className="mt-0.5 flex size-9 items-center justify-center rounded-[18px]"
            style={{ backgroundColor: "var(--responses-brand-subtle)" }}
          >
            {icon}
          </span>
          <div className="min-w-0">
            {title ? (
              <span className="text-[11px] font-semibold tracking-[0.16em] text-[color:var(--responses-heading-muted)] uppercase">
                {title}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
      <p className="text-sm leading-6">{children}</p>
    </div>
  );
}
