"use client";

import type { ComponentType, Dispatch, ReactNode, SetStateAction } from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Bell, MessageCircle, UserRound, WalletCards } from "lucide-react";
import type { SettingsPageData } from "@/server/queries/settings";
import { SettingsCard } from "@/components/dashboard/settings/settings-card";

type NotificationPreferencesCardProps = {
  notifications: SettingsPageData["notifications"];
};

type NotificationKey = "billingUpdates" | "guestMessage" | "newRsvpResponse";

export function NotificationPreferencesCard({
  notifications,
}: NotificationPreferencesCardProps) {
  const [localState, setLocalState] = useState({
    billingUpdates: notifications.billingUpdates,
    guestMessage: notifications.guestMessage,
    newRsvpResponse: notifications.newRsvpResponse,
  });

  return (
    <SettingsCard>
      <SectionLabel>Notification Preferences</SectionLabel>
      <div className="mt-5">
        <NotificationRow
          checked={localState.newRsvpResponse}
          icon={UserRound}
          label="New RSVP response"
          onCheckedChange={(checked) => updateLocalState("newRsvpResponse", checked, setLocalState)}
        />
        <Separator className="bg-[#eee5db]" />
        <NotificationRow
          checked={localState.guestMessage}
          icon={MessageCircle}
          label="Guest message"
          onCheckedChange={(checked) => updateLocalState("guestMessage", checked, setLocalState)}
        />
        <Separator className="bg-[#eee5db]" />
        <NotificationRow
          checked={localState.billingUpdates}
          icon={WalletCards}
          label="Billing updates"
          onCheckedChange={(checked) => updateLocalState("billingUpdates", checked, setLocalState)}
        />
        <Separator className="bg-[#eee5db]" />
        <NotificationRow
          badge={<SoonBadge />}
          checked={notifications.pushNotifications}
          description="Browser and device alerts"
          disabled
          icon={Bell}
          label="Push notifications"
        />
      </div>
      <p className="mt-4 text-sm font-semibold leading-relaxed text-[#b09887]">
        Preference syncing is coming soon. These switches currently stay on this device only.
      </p>
      {/* TODO: Replace local-only switch state when a tenant-scoped notification preference model exists. */}
    </SettingsCard>
  );
}

function updateLocalState(
  key: NotificationKey,
  checked: boolean,
  setLocalState: Dispatch<SetStateAction<Record<NotificationKey, boolean>>>,
) {
  setLocalState((current) => ({
    ...current,
    [key]: checked,
  }));
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[color:var(--dash-brand)]">
      {children}
    </p>
  );
}

function SoonBadge() {
  return (
    <Badge
      className="rounded-full border-[#e8ddd1] bg-[#f3ece3] px-2.5 py-1 text-[0.7rem] font-black text-[#b49b8a]"
      variant="outline"
    >
      Soon
    </Badge>
  );
}

function NotificationRow({
  badge,
  checked,
  description,
  disabled,
  icon: Icon,
  label,
  onCheckedChange,
}: {
  badge?: ReactNode;
  checked: boolean;
  description?: string;
  disabled?: boolean;
  icon: ComponentType<{ className?: string }>;
  label: string;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-5 py-6 first:pt-0 last:pb-0">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f6eee5] text-[color:var(--dash-brand)]"
        aria-hidden="true"
      >
        <Icon className={`h-[18px] w-[18px]${disabled ? " opacity-50" : ""}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`text-base font-black ${disabled ? "text-[#a9978b]" : "text-[color:var(--dash-foreground)]"}`}>
            {label}
          </p>
          {badge}
        </div>
        {description ? (
          <p className="mt-1 text-sm font-semibold text-[#c3b3a6]">{description}</p>
        ) : null}
      </div>
      <Switch
        checked={checked}
        className="data-checked:bg-[color:var(--dash-brand)] data-unchecked:bg-[#efe8df]"
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </div>
  );
}
