"use client";

import type { ComponentType } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Download, Globe2, Laptop, Plus, Smartphone } from "lucide-react";
import { SafariShareIcon } from "@/components/dashboard/settings/safari-share-icon";

type InstallAppDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InstallAppDialog({ open, onOpenChange }: InstallAppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[560px] gap-0 overflow-hidden rounded-[26px] border border-[#ead8c4] bg-[#fffdf8] p-0 shadow-[0_28px_80px_rgba(55,35,24,0.22)]"
        showCloseButton={false}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#eee5db] px-5 py-4">
          <DialogHeader className="flex-1 flex-row items-start gap-3 space-y-0">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--dash-brand)] text-white shadow-[0_12px_28px_rgba(200,109,74,0.22)]"
              aria-hidden="true"
            >
              <Download className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-lg font-black leading-tight text-[color:var(--dash-foreground)]">
                Install WebSerbisyo RSVP App
              </DialogTitle>
              <DialogDescription className="text-sm font-semibold text-[#8d7667]">
                Choose your device and follow the steps.
              </DialogDescription>
            </div>
          </DialogHeader>
          <button
            type="button"
            aria-label="Close install instructions"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#eee0d3] bg-[#fff8f0] text-[#8d7667] transition hover:bg-[#f8e9df] hover:text-[color:var(--dash-brand)]"
            onClick={() => onOpenChange(false)}
          >
            <span className="text-lg leading-none" aria-hidden="true">
              ×
            </span>
          </button>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <InstructionCard
            icon={Laptop}
            steps={[
              { icon: Download, text: "Tap Install App." },
              { icon: CheckCircle2, text: "Confirm Install." },
              { icon: Globe2, text: "Open and sign in." },
            ]}
            title="Android & Desktop"
          />
          <InstructionCard
            icon={Smartphone}
            steps={[
              { icon: Globe2, text: "Open in Safari." },
              { icon: SafariShareIcon, text: "Tap Share." },
              { icon: Plus, text: "Tap Add to Home Screen." },
            ]}
            title="iPhone & iPad"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InstructionCard({
  icon: Icon,
  steps,
  title,
}: {
  icon: ComponentType<{ className?: string }>;
  steps: Array<{ icon: ComponentType<{ className?: string }>; text: string }>;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-[#eee0d3] bg-[#fffaf3] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fbf0e9] text-[color:var(--dash-brand)]"
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </div>
        <h4 className="text-sm font-black text-[color:var(--dash-foreground)]">{title}</h4>
      </div>

      <div className="mt-4 space-y-2.5">
        {steps.map((step) => {
          const StepIcon = step.icon;

          return (
            <div
              key={step.text}
              className="flex items-center gap-3 rounded-xl bg-white/60 px-3 py-2.5 text-sm font-bold text-[#7f6758]"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f5dfd1] text-[color:var(--dash-brand)] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
                aria-hidden="true"
              >
                <StepIcon className="h-4 w-4" />
              </span>
              <p>{step.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
