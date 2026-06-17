import { MessengerLogo } from "@/components/dashboard/billing/messenger-logo";
import { SettingsCard } from "@/components/dashboard/settings/settings-card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import type { SettingsPageData } from "@/server/queries/settings";

type SupportCardProps = {
  support: SettingsPageData["support"];
};

export function SupportCard({ support }: SupportCardProps) {
  return (
    <SettingsCard className="dashboard-settings-support-card">
      <div className="dashboard-settings-support-card__hero flex items-start gap-4">
        <div
          className="dashboard-settings-support-card__hero-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eaf2ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]"
          aria-hidden="true"
        >
          <MessengerLogo className="h-5 w-5" />
        </div>
        <div className="dashboard-settings-support-card__hero-content min-w-0 flex-1">
          <p className="text-sm font-black tracking-[0.16em] text-[color:var(--dash-brand)] uppercase">
            Need help?
          </p>
          <h3 className="mt-1 text-[1.2rem] font-black tracking-[-0.02em] text-[color:var(--dash-foreground)]">
            We&apos;re here for you
          </h3>
          <p className="mt-2 text-sm leading-relaxed font-semibold text-[#8d7667]">
            Message WebSerbisyo for account, RSVP, or dashboard support.
          </p>
        </div>
      </div>

      {support.isEnabled && support.messengerUrl ? (
        <Button
          asChild
          className="mt-5 h-11 w-full rounded-full bg-[color:var(--dash-brand)] px-5 text-sm font-black text-white shadow-[0_12px_26px_rgba(201,107,72,0.28)] hover:bg-[color:var(--dash-brand-hover)]"
        >
          <a href={support.messengerUrl} rel="noreferrer" target="_blank">
            Contact Support
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </Button>
      ) : (
        <Button
          type="button"
          disabled
          className="mt-5 h-11 w-full rounded-full bg-[color:var(--dash-brand)] px-5 text-sm font-black text-white shadow-[0_12px_26px_rgba(201,107,72,0.2)]"
        >
          Contact Support
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}

      <p className="mt-3 text-center text-xs font-semibold tracking-[0.01em] text-[#b09887]">
        via Facebook Messenger
      </p>
    </SettingsCard>
  );
}
