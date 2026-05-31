"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  DashboardNotificationToast,
  type DashboardNotificationToastChip,
} from "@/components/dashboard/notifications/dashboard-notification-toast";
import { createClient } from "@/lib/supabase/client";
import {
  DASHBOARD_NOTIFICATION_PREFERENCE_EVENT,
  NOTIFICATION_EVENT_TYPES,
  type DashboardNotificationPreferenceEventDetail,
  type NotificationEventType,
} from "@/types/notifications";

type DashboardRealtimeNotificationsProps = {
  clientId: string;
  profileId: string;
};

type RsvpResponseRealtimeRow = {
  attendance_status?: string | null;
  client_id?: string | null;
  guest_name?: string | null;
  id?: string | null;
  message?: string | null;
  party_size?: number | null;
};

type PaymentRealtimeRow = {
  client_id?: string | null;
  id?: string | null;
  payment_status?: string | null;
};

type InAppPreferenceState = Record<NotificationEventType, boolean>;

const DEFAULT_IN_APP_PREFERENCES: InAppPreferenceState = {
  billing_update: true,
  guest_message: true,
  new_rsvp_response: true,
};

export function DashboardRealtimeNotifications({
  clientId,
  profileId,
}: DashboardRealtimeNotificationsProps) {
  const router = useRouter();
  const preferencesRef = useRef<InAppPreferenceState>(DEFAULT_IN_APP_PREFERENCES);
  const shownEventsRef = useRef(new Set<string>());
  const handleToastAction = useEffectEvent((toastId: string, url: string) => {
    toast.dismiss(toastId);
    router.push(url);
  });

  useEffect(() => {
    let isActive = true;
    const supabase = createClient();

    function handlePreferenceChange(event: Event) {
      const detail = (event as CustomEvent<Partial<DashboardNotificationPreferenceEventDetail>>)
        .detail;

      if (
        !detail ||
        !isNotificationEventType(detail.eventType) ||
        typeof detail.inAppEnabled !== "boolean"
      ) {
        return;
      }

      preferencesRef.current = {
        ...preferencesRef.current,
        [detail.eventType]: detail.inAppEnabled,
      };
    }

    window.addEventListener(DASHBOARD_NOTIFICATION_PREFERENCE_EVENT, handlePreferenceChange);

    async function startRealtime() {
      const { data: preferences, error } = await supabase
        .from("notification_preferences")
        .select("event_type, in_app_enabled")
        .eq("profile_id", profileId)
        .eq("client_id", clientId);

      if (!isActive) return;

      if (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[dashboard-realtime] Falling back to default notification preferences",
            {
              code: error.code,
              message: error.message,
            },
          );
        }
      } else {
        preferencesRef.current = {
          ...DEFAULT_IN_APP_PREFERENCES,
          ...Object.fromEntries(
            (preferences ?? [])
              .filter((row) => isNotificationEventType(row.event_type))
              .map((row) => [row.event_type, row.in_app_enabled]),
          ),
        } as InAppPreferenceState;
      }

      const responsesChannel = supabase
        .channel(`dashboard-rsvp-responses:${clientId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            filter: `client_id=eq.${clientId}`,
            schema: "public",
            table: "rsvp_responses",
          },
          (payload: RealtimePostgresChangesPayload<RsvpResponseRealtimeRow>) => {
            handleRsvpResponseInsert(payload.new);
          },
        )
        .subscribe();

      const paymentsChannel = supabase
        .channel(`dashboard-payments:${clientId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            filter: `client_id=eq.${clientId}`,
            schema: "public",
            table: "payments",
          },
          (payload: RealtimePostgresChangesPayload<PaymentRealtimeRow>) => {
            handlePaymentChange(payload);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            filter: `client_id=eq.${clientId}`,
            schema: "public",
            table: "payments",
          },
          (payload: RealtimePostgresChangesPayload<PaymentRealtimeRow>) => {
            handlePaymentChange(payload);
          },
        )
        .subscribe();

      return () => {
        void supabase.removeChannel(responsesChannel);
        void supabase.removeChannel(paymentsChannel);
      };
    }

    let cleanupRealtime: (() => void) | undefined;

    void startRealtime().then((cleanup) => {
      cleanupRealtime = cleanup;
    });

    function handleRsvpResponseInsert(row: RsvpResponseRealtimeRow) {
      const responseId = row.id;

      if (!responseId || row.client_id !== clientId) return;

      const hasGuestMessage = Boolean(row.message?.trim());
      const guestName = formatGuestName(row.guest_name);

      if (hasGuestMessage && preferencesRef.current.guest_message) {
        if (!markEventShown(`guest_message:${responseId}`)) return;

        showDashboardToast({
          body: `${guestName} left a message.`,
          chips: [{ label: "Needs review", tone: "warning" }],
          ctaLabel: "Review",
          eventType: "guest_message",
          toastKey: `guest_message:${responseId}`,
          title: "New guest message",
          url: "/dashboard/responses",
          variant: "guest_message",
        });
        return;
      }

      if (!preferencesRef.current.new_rsvp_response) return;
      if (!markEventShown(`new_rsvp_response:${responseId}`)) return;

      showDashboardToast({
        body: `${guestName} submitted an RSVP.`,
        chips: getRsvpToastChips(row),
        ctaLabel: "View",
        eventType: "new_rsvp_response",
        toastKey: `new_rsvp_response:${responseId}`,
        title: "New RSVP response",
        url: "/dashboard/responses",
        variant: "rsvp",
      });
    }

    function handlePaymentChange(payload: RealtimePostgresChangesPayload<PaymentRealtimeRow>) {
      const row = payload.new as PaymentRealtimeRow;
      const paymentId = row.id;

      if (!paymentId || row.client_id !== clientId) return;
      if (!preferencesRef.current.billing_update) return;
      const statusChange = getBillingStatusChange(payload);

      if (!statusChange) return;
      if (!markEventShown(`billing_update:${payload.eventType}:${paymentId}:${statusChange.label}`)) return;

      showDashboardToast({
        body: "Your payment status was updated.",
        chips: [{ label: statusChange.label, tone: statusChange.tone }],
        ctaLabel: "View",
        eventType: "billing_update",
        toastKey: `billing_update:${payload.eventType}:${paymentId}:${statusChange.label}`,
        title: "Billing update",
        url: "/dashboard/billing",
        variant: "billing",
      });
    }

    function markEventShown(key: string) {
      if (shownEventsRef.current.has(key)) {
        return false;
      }

      shownEventsRef.current.add(key);
      return true;
    }

    function showDashboardToast(input: {
      body: string;
      chips?: DashboardNotificationToastChip[];
      ctaLabel: string;
      eventType: NotificationEventType;
      toastKey: string;
      title: string;
      url: string;
      variant: "billing" | "guest_message" | "rsvp";
    }) {
      const toastId = input.toastKey;

      toast.custom(() => (
        <DashboardNotificationToast
          body={input.body}
          chips={input.chips}
          ctaLabel={input.ctaLabel}
          onAction={() => handleToastAction(toastId, input.url)}
          title={input.title}
          variant={input.variant}
        />
      ), {
        duration: 5200,
        id: toastId,
      });
    }

    return () => {
      isActive = false;
      window.removeEventListener(DASHBOARD_NOTIFICATION_PREFERENCE_EVENT, handlePreferenceChange);
      cleanupRealtime?.();
    };
  }, [clientId, profileId]);

  return null;
}

function isNotificationEventType(value: unknown): value is NotificationEventType {
  return (
    typeof value === "string" &&
    NOTIFICATION_EVENT_TYPES.includes(value as NotificationEventType)
  );
}

function formatPaymentStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatGuestName(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed || "A guest";
}

function getRsvpToastChips(row: RsvpResponseRealtimeRow): DashboardNotificationToastChip[] {
  const chips: DashboardNotificationToastChip[] = [];
  const attendanceChip = getAttendanceChip(row.attendance_status);

  if (attendanceChip) {
    chips.push(attendanceChip);
  }

  if (row.party_size && row.party_size > 1) {
    chips.push({
      label: `Party of ${row.party_size}`,
      tone: "neutral",
    });
  }

  return chips;
}

function getAttendanceChip(value: string | null | undefined): DashboardNotificationToastChip | null {
  switch (value) {
    case "attending":
      return {
        label: "Attending",
        tone: "success",
      };
    case "not_attending":
      return {
        label: "Not attending",
        tone: "danger",
      };
    default:
      return null;
  }
}

function getBillingStatusChange(
  payload: RealtimePostgresChangesPayload<PaymentRealtimeRow>,
): DashboardNotificationToastChip | null {
  const nextRow = payload.new as PaymentRealtimeRow | null | undefined;
  const previousRow = payload.old as PaymentRealtimeRow | null | undefined;
  const nextStatus = nextRow?.payment_status ?? null;

  if (!nextStatus) {
    return null;
  }

  if (payload.eventType === "UPDATE") {
    const previousStatus = previousRow?.payment_status ?? null;

    if (!previousStatus || previousStatus === nextStatus) {
      return null;
    }
  }

  if (payload.eventType !== "INSERT" && payload.eventType !== "UPDATE") {
    return null;
  }

  return mapPaymentStatusChip(nextStatus);
}

function mapPaymentStatusChip(value: string): DashboardNotificationToastChip {
  switch (value) {
    case "paid":
      return {
        label: "Confirmed",
        tone: "success",
      };
    case "pending":
      return {
        label: "Pending",
        tone: "warning",
      };
    case "refunded":
      return {
        label: "Refunded",
        tone: "danger",
      };
    case "failed":
      return {
        label: "Failed",
        tone: "danger",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        tone: "danger",
      };
    default:
      return {
        label: formatPaymentStatus(value),
        tone: "neutral",
      };
  }
}
