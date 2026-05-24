"use client";

import { AlertTriangle, CheckCircle2, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-wa-dialog
        showCloseButton={false}
        className="max-w-[calc(100%-1.5rem)] overflow-hidden rounded-[1.75rem] border border-[#e9dcd2] bg-[#FFFDFC] p-0 shadow-[0_24px_64px_rgba(45,31,26,0.18)] ring-0 sm:max-w-[36rem]"
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0 text-left">
          {/* Top row: Icon + Title + Close */}
          <div className="flex items-start justify-between gap-4">
            {/* Left side: Icon + Title */}
            <div className="flex items-center gap-4">
              {/* Icon tile */}
              <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF0D9] text-[#A86F2A]">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>

              <DialogTitle className="text-base font-semibold tracking-tight text-[#2D1F1A]">
                Change RSVP subdomain?
              </DialogTitle>
            </div>

            {/* Right side: Close */}
            <DialogClose asChild>
              <button
                type="button"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#e9dcd2] text-[#A38376] transition-colors hover:bg-[#f8eee7] hover:text-[#2D1F1A]"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </DialogClose>
          </div>

          {/* Subtitle */}
          <DialogDescription className="mt-3 text-sm leading-relaxed text-[#A38376]">
            Use this only for a typo, wrong name, or test link before guests receive the final website.
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="space-y-6 px-6 pt-3 pb-2">

          {/* Current URL section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#A38376]">
              Current RSVP subdomain
            </label>
            <div className="flex h-11 items-center gap-2 rounded-xl border border-[#e9dcd2] bg-[#FBF4EF]/50 px-3.5 opacity-80">
              <Lock className="h-4 w-4 shrink-0 text-[#B49B90]" aria-hidden="true" />
              {currentSlug ? (
                <>
                  <span className="font-mono text-sm font-semibold text-[#8C766C]">{currentSlug}</span>
                  <span className="text-xs text-[#A38376]">.{suffix}</span>
                </>
              ) : (
                <span className="text-sm text-[#A38376]">Not set yet</span>
              )}
            </div>
          </div>

          {/* New URL section */}
          <div className="space-y-2">
            <label
              htmlFor="website-access-slug-dialog"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-[#A38376]"
            >
              New RSVP subdomain
            </label>
            <div
              className={cn(
                "flex h-11 items-center gap-2 rounded-xl border px-3.5 transition-shadow focus-within:shadow-[0_0_0_3px_rgba(201,112,75,0.1)]",
                errorMessage
                  ? "border-amber-300 bg-amber-50/50"
                  : "border-[#eacdbf] bg-[#FBF4EF]",
              )}
            >
              {errorMessage ? (
                <AlertTriangle
                  className="h-4 w-4 shrink-0 text-[#A86F2A]"
                  aria-hidden="true"
                />
              ) : (
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-[#4E8366]"
                  aria-hidden="true"
                />
              )}
              <Input
                id="website-access-slug-dialog"
                value={value}
                disabled={pending}
                aria-invalid={errorMessage ? "true" : "false"}
                onChange={(event) => onValueChange(event.target.value)}
                className="h-auto border-0 bg-transparent px-0 py-0 font-mono text-sm font-semibold text-[#2D1F1A] shadow-none focus-visible:ring-0"
              />
              <span className="shrink-0 text-xs text-[#A38376]">.{suffix}</span>
            </div>
            {errorMessage ? (
              <p className="text-sm text-[#A86F2A]">{errorMessage}</p>
            ) : (
              <p className="text-sm text-[#A38376]">
                Lowercase letters, numbers, and hyphens only. The final live subdomain applies on publish.
              </p>
            )}
          </div>

          {/* Soft notice card */}
          <div className="rounded-2xl border border-[#e9dcd2] bg-[#FEFAF7] px-5 py-4">
            <p className="mb-2.5 text-sm font-semibold text-[#2D1F1A]">
              Before confirming
            </p>
            <ul className="space-y-1.5 text-sm leading-relaxed text-[#A38376]">
              <li className="flex gap-2">
                <span className="shrink-0 text-[#c96f4c]">•</span>
                Current shared links and QR codes may need to be replaced.
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 text-[#c96f4c]">•</span>
                The live website keeps using the current URL until you publish
                latest changes.
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 text-[#c96f4c]">•</span>
                Guests should only receive the final link after this is
                confirmed.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-[#e9dcd2] bg-[#FEFAF7]/70 px-7 py-5 sm:flex-row sm:justify-end sm:gap-3.5">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
            className="h-10 rounded-xl border-[#e9dcd2] bg-white px-5 text-sm font-semibold text-[#6B4B40] hover:bg-[#FEFAF7]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={pending || Boolean(errorMessage)}
            onClick={onConfirm}
            className="h-10 rounded-xl bg-[#c96f4c] px-5 text-sm font-semibold text-white shadow-sm shadow-[#c96f4c]/20 hover:bg-[#b96143] disabled:bg-[#c96f4c]/40 disabled:text-white/80 disabled:shadow-none"
          >
            Confirm subdomain change
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
