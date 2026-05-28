"use client";

import type { ComponentType, ReactNode } from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Bell, MessageCircle, UserRound, WalletCards } from "lucide-react";
import type { SettingsPageData } from "@/server/queries/settings";
import { SettingsCard } from "@/components/dashboard/settings/settings-card";
import { updateInAppNotificationPreferenceAction } from "@/server/actions/settings-notifications";
import type { NotificationEventType } from "@/types/notifications";
import { toast } from "sonner";

type NotificationPreferencesCardProps = {
  notifications: SettingsPageData["notifications"];
};

const NOTIFICATION_ROWS: Array<{
  eventType: NotificationEventType;
  icon: ComponentType<{ className?: string }>;
  label: string;
}> = [
  {
    eventType: "new_rsvp_response",
    icon: UserRound,
    label: "New RSVP response",
  },
  {
    eventType: "guest_message",
    icon: MessageCircle,
    label: "Guest message",
  },
  {
    eventType: "billing_update",
    icon: WalletCards,
    label: "Billing updates",
  },
];

export function NotificationPreferencesCard({
  notifications,
}: NotificationPreferencesCardProps) {
  const [inAppState, setInAppState] = useState(() => ({
    billing_update: notifications.preferences.billing_update.inAppEnabled,
    guest_message: notifications.preferences.guest_message.inAppEnabled,
    new_rsvp_response: notifications.preferences.new_rsvp_response.inAppEnabled,
  }));
  const [savingState, setSavingState] = useState<Record<NotificationEventType, boolean>>({
    billing_update: false,
    guest_message: false,
    new_rsvp_response: false,
  });

  async function updatePreference(eventType: NotificationEventType, checked: boolean) {
    const previous = inAppState[eventType];

    setInAppState((current) => ({
      ...current,
      [eventType]: checked,
    }));
    setSavingState((current) => ({
      ...current,
      [eventType]: true,
    }));

    const result = await updateInAppNotificationPreferenceAction({
      enabled: checked,
      eventType,
    });

    if (!result.ok) {
      setInAppState((current) => ({
        ...current,
        [eventType]: previous,
      }));
      toast.error(result.error);
    } else {
      setInAppState((current) => ({
        ...current,
        [eventType]: result.data.inAppEnabled,
      }));
    }

    setSavingState((current) => ({
      ...current,
      [eventType]: false,
    }));
  }

  return (
    <SettingsCard>
      <SectionLabel>Notification Preferences</SectionLabel>
      <div className="mt-5">
        {NOTIFICATION_ROWS.map((row, index) => (
          <NotificationRowGroup key={row.eventType} showSeparator={index > 0}>
            <NotificationRow
              checked={inAppState[row.eventType]}
              disabled={savingState[row.eventType]}
              icon={row.icon}
              label={row.label}
              onCheckedChange={(checked) => {
                void updatePreference(row.eventType, checked);
              }}
            />
          </NotificationRowGroup>
        ))}
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
        Preferences sync with your WebSerbisyo account.
      </p>
    </SettingsCard>
  );
}

function NotificationRowGroup({
  children,
  showSeparator,
}: {
  children: ReactNode;
  showSeparator: boolean;
}) {
  return (
    <>
      {showSeparator ? <Separator className="bg-[#eee5db]" /> : null}
      {children}
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
