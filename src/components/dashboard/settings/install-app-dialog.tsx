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
import {
  EllipsisVertical,
  Share,
  Smartphone,
  SquarePlus,
  XIcon,
  LaptopMinimal,
} from "lucide-react";

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
            Tap the <InlineInstructionIcon icon={<Share className="size-4" />} label="Share" />{" "}
            Share icon near the address bar.
          </>
        ),
        hint: "It may be at the bottom on some devices.",
      },
      {
        body: (
          <>
            Tap{" "}
            <InlineInstructionIcon
              icon={<SquarePlus className="size-4" />}
              label="Add to Home Screen"
            />{" "}
            Add to Home Screen.
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
            Tap the{" "}
            <InlineInstructionIcon icon={<EllipsisVertical className="size-4" />} label="menu" />{" "}
            menu near the address bar.
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
            Click the{" "}
            <InlineInstructionIcon
              icon={<DesktopInstallGlyph className="size-4" />}
              label="install"
            />{" "}
            install icon in the address bar.
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
        className="max-h-[min(88dvh,42rem)] max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden rounded-[2.1rem] border border-[#ead8ca] bg-[#fffaf4] p-0 text-[color:var(--dash-foreground)] shadow-[0_30px_90px_rgba(47,31,22,0.26)] ring-[#f1e2d0]/80 sm:max-w-[548px]"
      >
        <div className="overflow-y-auto px-5 pt-5 pb-5 sm:px-7 sm:pt-7 sm:pb-6">
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-10 w-10 rounded-full border border-[#ead8ca] bg-white/80 text-[#7e675d] shadow-none transition hover:bg-[#fff1e8] hover:text-[#c45f3f]"
              aria-label="Close install app dialog"
            >
              <XIcon className="size-4" />
            </Button>
          </DialogClose>

          <DialogHeader className="gap-0 pr-12">
            <div className="flex items-center gap-4">
              <div
                className="relative h-12 w-12 shrink-0 rounded-2xl border border-[#ead9cc] bg-[#fffaf5] p-[4px] shadow-[0_12px_30px_rgba(122,72,43,0.12)]"
                aria-hidden="true"
              >
                <div className="relative h-full w-full overflow-hidden rounded-xl bg-[#fff0e6] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                  <Image
                    src="/images/brand/webserbisyo-logo.jpeg"
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover object-center"
                  />
                </div>
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-2xl leading-tight font-black tracking-[-0.04em] text-[#171313] sm:text-[1.95rem]">
                  Install WebSerbisyo RSVP
                </DialogTitle>
                <DialogDescription className="mt-1 text-[14px] leading-6 font-bold text-[#705f57]">
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
              className="grid h-auto w-full grid-cols-3 rounded-full border-0 bg-transparent p-0"
            >
              {PLATFORM_OPTIONS.map((option) => (
                <TabsTrigger
                  key={option.value}
                  value={option.value}
                  className={cn(
                    "h-10 rounded-full border border-[#ead9ce] bg-white px-4 text-sm font-black text-[#725f56] shadow-none transition after:hidden hover:bg-[#fff6ef]",
                    "data-active:border-[#d9a891] data-active:bg-[#fff0e7] data-active:text-[#c45f3f] data-active:shadow-[0_8px_20px_rgba(196,95,63,0.12)]",
                  )}
                >
                  {option.icon}
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <section className="mt-5 rounded-[24px] border border-[#ead8ca] bg-white/72 p-5">
            <ol className="space-y-5">
              {guide.steps.map((step, index) => (
                <li key={index} className="grid grid-cols-[38px_minmax(0,1fr)] items-start gap-4">
                  <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-full bg-[#221c18] text-base leading-none font-black text-white shadow-[0_8px_18px_rgba(34,28,24,0.20)]">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[17px] leading-7 font-black text-[#1f1a17]">{step.body}</p>
                    {step.hint ? (
                      <p className="mt-1 text-[14px] leading-6 font-bold text-[#79675f]">
                        {step.hint}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <div className="mt-5 flex justify-end border-t border-[#ead8ca] pt-5">
            <DialogClose asChild>
              <Button
                type="button"
                className="h-11 rounded-2xl bg-[#d36b46] px-6 text-sm font-black text-white shadow-[0_14px_30px_rgba(196,90,55,0.22)] transition hover:bg-[#c4603f]"
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

function InlineInstructionIcon({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="mx-1 inline-flex h-7 w-7 translate-y-[1px] items-center justify-center rounded-lg border border-[#ead6c9] bg-white align-middle text-[#171313] shadow-[0_5px_12px_rgba(70,45,31,0.09)]">
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
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="5" width="16" height="12" rx="2" />
      <path d="M12 8v5" />
      <path d="m9.5 10.5 2.5 2.5 2.5-2.5" />
      <path d="M8 20h8" />
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
