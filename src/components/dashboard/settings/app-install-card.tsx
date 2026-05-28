"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AppWindow } from "lucide-react";
import { SettingsCard } from "@/components/dashboard/settings/settings-card";
import {
  getDefaultInstallPlatform,
  InstallAppDialog,
} from "@/components/dashboard/settings/install-app-dialog";

export function AppInstallCard() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState(() => getDefaultInstallPlatform());

  return (
    <>
      <SettingsCard>
        <SectionLabel>App Installation</SectionLabel>
        <div className="mt-5 flex items-center gap-4">
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
            setPlatform(getDefaultInstallPlatform());
            setOpen(true);
          }}
        >
          <AppWindow className="h-[18px] w-[18px]" aria-hidden="true" />
          Install App
        </Button>
      </SettingsCard>

      <InstallAppDialog
        open={open}
        onOpenChange={setOpen}
        onPlatformChange={setPlatform}
        platform={platform}
      />
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
