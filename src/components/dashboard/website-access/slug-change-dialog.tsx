"use client";

import { AlertTriangle, CheckCircle2, Lock, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/index";

type SlugChangeDialogProps = {
  currentSlug: string;
  errorMessage: string | null;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  onValueChange: (value: string) => void;
  open: boolean;
  pending?: boolean;
  suffix?: string;
  value: string;
};

type SlugChangeBodyProps = {
  currentSlug: string;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: () => void;
  onValueChange: (value: string) => void;
  pending?: boolean;
  suffix?: string;
  value: string;
};

function SlugChangeBody({
  currentSlug,
  errorMessage,
  onClose,
  onConfirm,
  onValueChange,
  pending = false,
  suffix = "rsvp.webserbisyo.com",
  value,
}: SlugChangeBodyProps) {
  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF0D9] text-[#A86F2A]">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-[#2D1F1A] sm:text-xl">
              Change RSVP Subdomain?
            </h3>
            <p className="mt-0.5 text-xs font-medium text-[#704D5B] sm:text-sm">
              Use this only for typos or test links before sharing with guests.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#E9DCD2] text-[#A38376] transition-colors hover:bg-[#F8EEE7] hover:text-[#2D1F1A]"
          aria-label="Close"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Current Subdomain Inline Badge */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
        <span className="text-xs font-bold tracking-wider text-[#A38376] uppercase">
          Current subdomain:
        </span>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-[#EADBD0] bg-[#F4EBEB] px-3 py-1.5 font-mono text-xs font-bold text-[#6B4B40] sm:text-sm">
          <Lock className="h-3.5 w-3.5 shrink-0 text-[#A38376]" aria-hidden="true" />
          {currentSlug ? `${currentSlug}.${suffix}` : "Not set yet"}
        </span>
      </div>

      {/* Centerpiece New Subdomain Input */}
      <div className="space-y-2">
        <label
          htmlFor="website-access-slug-dialog"
          className="text-xs font-bold tracking-wider text-[#2D1F1A] uppercase sm:text-sm"
        >
          New RSVP subdomain
        </label>
        <div
          className={cn(
            "flex h-12 items-center gap-2 rounded-xl border-2 bg-white px-4 transition-colors sm:h-13",
            errorMessage
              ? "border-amber-400 bg-amber-50/40 focus-within:border-amber-500"
              : "border-[#EADBD0] focus-within:border-[#C96B48]",
          )}
        >
          {errorMessage ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#A86F2A]" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#4E8366]" aria-hidden="true" />
          )}
          <Input
            id="website-access-slug-dialog"
            value={value}
            disabled={pending}
            aria-invalid={errorMessage ? "true" : "false"}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder="your-name"
            className="h-auto flex-1 border-0 bg-transparent px-0 py-0 font-mono text-base md:text-sm font-bold text-[#2D1F1A] shadow-none focus-visible:ring-0"
          />
          <span className="shrink-0 font-mono text-xs font-semibold text-[#A38376] sm:text-sm">
            .{suffix}
          </span>
        </div>
        {errorMessage ? (
          <p className="text-xs font-semibold text-[#A86F2A] sm:text-sm">{errorMessage}</p>
        ) : (
          <p className="text-xs font-semibold text-[#A38376]">
            Lowercase letters, numbers, and hyphens only.
          </p>
        )}
      </div>

      {/* Warning Callout Banner */}
      <div className="space-y-1 rounded-xl border-l-4 border-[#E65C4F] bg-[#FFF5F2] p-4 text-xs font-semibold text-[#8A2424] sm:text-sm">
        <p className="flex items-center gap-1.5 text-sm font-bold text-[#8A2424] sm:text-base">
          <span aria-hidden="true">⚠️</span> Warning on Shared Links
        </p>
        <p className="text-xs font-medium text-[#8A2424]/90 sm:text-sm">
          Any links or QR codes already sent to guests will stop working once this change is
          published.
        </p>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={onClose}
          className="h-12 text-sm font-bold text-[#704D5B] hover:bg-[#F4EBEB] sm:text-base"
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={pending || Boolean(errorMessage) || !value.trim()}
          onClick={onConfirm}
          className="h-12 w-full rounded-xl bg-[#C96B48] px-6 text-sm font-bold text-white shadow-md shadow-[#C96B48]/20 hover:bg-[#B35836] disabled:opacity-50 sm:w-auto sm:text-base"
        >
          {pending ? "Saving changes..." : "Confirm Subdomain Change"}
        </Button>
      </div>
    </div>
  );
}

export function SlugChangeDialog({
  currentSlug,
  errorMessage,
  onConfirm,
  onOpenChange,
  onValueChange,
  open,
  pending = false,
  suffix = "rsvp.webserbisyo.com",
  value,
}: SlugChangeDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90dvh] overflow-y-auto rounded-t-[1.75rem] border border-[#EADBD0] bg-[#FFFAF6] p-6 shadow-2xl">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Change RSVP Subdomain?</DrawerTitle>
            <DrawerDescription>
              Use this only for typos or test links before sharing with guests.
            </DrawerDescription>
          </DrawerHeader>
          <SlugChangeBody
            currentSlug={currentSlug}
            errorMessage={errorMessage}
            onClose={() => onOpenChange(false)}
            onConfirm={onConfirm}
            onValueChange={onValueChange}
            pending={pending}
            suffix={suffix}
            value={value}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden rounded-2xl border border-[#EADBD0] bg-[#FFFAF6] p-6 shadow-2xl ring-0 sm:max-w-lg"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Change RSVP Subdomain?</DialogTitle>
          <DialogDescription>
            Use this only for typos or test links before sharing with guests.
          </DialogDescription>
        </DialogHeader>
        <SlugChangeBody
          currentSlug={currentSlug}
          errorMessage={errorMessage}
          onClose={() => onOpenChange(false)}
          onConfirm={onConfirm}
          onValueChange={onValueChange}
          pending={pending}
          suffix={suffix}
          value={value}
        />
      </DialogContent>
    </Dialog>
  );
}
