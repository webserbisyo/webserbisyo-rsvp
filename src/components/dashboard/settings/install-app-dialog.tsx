"use client";

import Image from "next/image";
import { type ReactNode } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { EllipsisVertical, Share, Smartphone, SquarePlus, XIcon, LaptopMinimal } from "lucide-react";

type InstallPlatform = "android" | "desktop" | "iphone";

type InstallAppDialogProps = {
  onPlatformChange: (platform: InstallPlatform) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  platform: InstallPlatform;
};

type InstallStep = {
  body: ReactNode;
  hint?: string;
};

type InstallGuide = {
  label: string;
  steps: InstallStep[];
};

const INSTALL_GUIDES: Record<InstallPlatform, InstallGuide> = {
  iphone: {
    label: "iPhone",
    steps: [
      {
        body: (
          <>
            Tap the <InlineInstructionIcon icon={<Share className="size-3.5" />} label="Share" /> Share icon near the address bar.
          </>
        ),
        hint: "It may be at the bottom on some devices.",
      },
      {
        body: (
          <>
            Tap <InlineInstructionIcon icon={<SquarePlus className="size-3.5" />} label="Add to Home Screen" /> Add to Home Screen.
          </>
        ),
        hint: "Scroll down or tap More if you can’t find it.",
      },
      {
        body: "Tap Add on the top-right.",
        hint: "WebSerbisyo will appear on your home screen.",
      },
    ],
  },
  android: {
    label: "Android",
    steps: [
      {
        body: (
          <>
            Tap the <InlineInstructionIcon icon={<EllipsisVertical className="size-3.5" />} label="menu" /> menu near the address bar.
          </>
        ),
      },
      {
        body: "Tap Install app or Add to Home screen.",
      },
      {
        body: "Tap Install or Add to confirm.",
        hint: "Open WebSerbisyo from your home screen after.",
      },
    ],
  },
  desktop: {
    label: "Desktop",
    steps: [
      {
        body: (
          <>
            Click the <InlineInstructionIcon icon={<DesktopInstallGlyph className="size-3.5" />} label="install" /> install icon in the address bar.
          </>
        ),
      },
      {
        body: "Click Install to confirm.",
        hint: "Chrome or Edge works best.",
      },
      {
        body: "Open it from your apps or dock.",
        hint: "It will behave like a regular app.",
      },
    ],
  },
};

const PLATFORM_OPTIONS: Array<{
  icon: ReactNode;
  label: string;
  value: InstallPlatform;
}> = [
  {
    icon: <Smartphone className="size-4" aria-hidden="true" />,
    label: "iPhone",
    value: "iphone",
  },
  {
    icon: <Smartphone className="size-4" aria-hidden="true" />,
    label: "Android",
    value: "android",
  },
  {
    icon: <LaptopMinimal className="size-4" aria-hidden="true" />,
    label: "Desktop",
    value: "desktop",
  },
];

export function InstallAppDialog({
  onOpenChange,
  onPlatformChange,
  open,
  platform,
}: InstallAppDialogProps) {
  const guide = INSTALL_GUIDES[platform];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[min(88dvh,42rem)] max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden rounded-[1.9rem] border border-[#ead8c4] bg-[#fffaf4] p-0 text-[color:var(--dash-foreground)] shadow-[0_24px_60px_rgba(83,54,33,0.16)] ring-[#f1e2d0]/80 sm:max-w-[540px]"
      >
        <div className="overflow-y-auto px-5 pt-5 pb-5 sm:px-6 sm:pt-6 sm:pb-6">
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-3 right-3 rounded-full text-[#8d7667] hover:bg-[#f7eee5] hover:text-[color:var(--dash-foreground)]"
              aria-label="Close install app dialog"
            >
              <XIcon className="size-4" />
            </Button>
          </DialogClose>

          <DialogHeader className="gap-0 pr-10">
            <div className="flex items-center gap-4">
              <div
                className="relative h-[72px] w-[72px] shrink-0 rounded-[1.35rem] border border-[#ead8c4] bg-[#fff7ef] p-[5px] shadow-[0_14px_30px_rgba(112,78,51,0.1),inset_0_1px_0_rgba(255,255,255,0.78)]"
                aria-hidden="true"
              >
                <div className="relative h-full w-full overflow-hidden rounded-[1rem] bg-[#fbf3eb] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                  <Image
                    src="/images/brand/webserbisyo-logo.jpeg"
                    alt=""
                    fill
                    sizes="72px"
                    className="object-cover object-center"
                  />
                </div>
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-[1.35rem] font-black leading-tight tracking-[-0.02em] text-[color:var(--dash-foreground)]">
                  Install WebSerbisyo RSVP
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm font-medium leading-relaxed text-[#8d7667]">
                  Open your dashboard faster from your home screen.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Tabs
            value={platform}
            onValueChange={(value) => onPlatformChange(value as InstallPlatform)}
            className="mt-5 gap-3"
          >
            <TabsList
              aria-label="Choose your device"
              className="grid h-auto w-full grid-cols-3 rounded-full border border-[#ead8c4] bg-[#f7eee5] p-1"
            >
              {PLATFORM_OPTIONS.map((option) => (
                <TabsTrigger
                  key={option.value}
                  value={option.value}
                  className={cn(
                    "h-10 rounded-full border-0 px-3 text-sm font-semibold text-[#8d7667] shadow-none after:hidden",
                    "data-active:bg-white data-active:text-[color:var(--dash-brand)] data-active:shadow-[0_8px_18px_rgba(112,78,51,0.08)]",
                  )}
                >
                  {option.icon}
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <section className="mt-4 rounded-[1.55rem] border border-[#eadfd4] bg-[linear-gradient(180deg,#fffdf8_0%,#fffaf4_100%)] px-4 py-4 shadow-[0_16px_42px_rgba(112,78,51,0.05),0_2px_0_rgba(255,255,255,0.78)_inset] sm:px-5">
            <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[color:var(--dash-brand)]">
              {guide.label}
            </p>

            <ol className="mt-4 space-y-4">
              {guide.steps.map((step, index) => (
                <li key={index} className="grid grid-cols-[1.9rem_minmax(0,1fr)] gap-3">
                  <span className="mt-0.5 flex h-[1.9rem] w-[1.9rem] items-center justify-center rounded-full bg-[#fff1e8] text-sm font-black text-[color:var(--dash-brand)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-6 text-[color:var(--dash-foreground)]">
                      {step.body}
                    </p>
                    {step.hint ? (
                      <p className="mt-1 text-sm leading-6 text-[#9a8476]">
                        <span className="font-semibold text-[#8d7667]">Hint:</span> {step.hint}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <div className="mt-5 flex justify-end">
            <DialogClose asChild>
              <Button
                type="button"
                className="h-11 rounded-full bg-[color:var(--dash-brand)] px-6 text-sm font-black text-white shadow-[0_12px_26px_rgba(201,107,72,0.28)] hover:bg-[color:var(--dash-brand-hover)]"
              >
                Got it
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InlineInstructionIcon({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <span className="mx-0.5 inline-flex h-5 min-w-5 translate-y-[1px] items-center justify-center rounded-md border border-[#ecd8c7] bg-[#fff7ef] px-1 text-[color:var(--dash-brand)] align-middle shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]">
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">{icon}</span>
    </span>
  );
}

function DesktopInstallGlyph({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <path d="M8 8.5h7.5" />
      <path d="M12 10.5v4.5" />
      <path d="m10.25 13.5 1.75 1.75 1.75-1.75" />
    </svg>
  );
}

export function getDefaultInstallPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") {
    return "desktop";
  }

  const userAgent = navigator.userAgent ?? "";
  const platform = navigator.platform ?? "";
  const maxTouchPoints = navigator.maxTouchPoints ?? 0;

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return "iphone";
  }

  if (platform === "MacIntel" && maxTouchPoints > 1) {
    return "iphone";
  }

  if (/Android/i.test(userAgent)) {
    return "android";
  }

  return "desktop";
}
