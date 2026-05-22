"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { InstallAppDialog } from "@/components/dashboard/settings/install-app-dialog";
import { SettingsCard } from "@/components/dashboard/settings/settings-card";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function AppInstallCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isIos] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  async function handleInstallClick() {
    if (deferredPrompt && !isIos) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice.catch(() => null);

      if (choice?.outcome === "accepted") {
        setDeferredPrompt(null);
        return;
      }
    }

    setDialogOpen(true);
  }

  return (
    <>
      <SettingsCard>
        <SectionLabel>App Installation</SectionLabel>
        <div className="mt-5 flex items-center gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.2rem] border border-[#efd9c7] bg-[#fbf0e9] text-[color:var(--dash-brand)] shadow-[0_12px_28px_rgba(200,109,74,0.11)]"
            aria-hidden="true"
          >
            <Download className="h-7 w-7" />
          </div>
          <h3 className="min-w-0 flex-1 text-lg font-black leading-snug text-[color:var(--dash-foreground)]">
            Install WebSerbisyo RSVP App
          </h3>
        </div>
        <p className="mt-4 text-sm font-semibold leading-relaxed text-[#8d7667]">
          Access your dashboard faster from your home screen.
        </p>
        <Button
          type="button"
          className="mt-6 h-[52px] w-full rounded-2xl bg-[color:var(--dash-brand)] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(200,109,74,0.22)] hover:bg-[color:var(--dash-brand-hover)]"
          onClick={() => {
            void handleInstallClick();
          }}
        >
          <Download className="h-[18px] w-[18px]" aria-hidden="true" />
          Install App
        </Button>
      </SettingsCard>

      <InstallAppDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[color:var(--dash-brand)]">
      {children}
    </p>
  );
}
