"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { toast } from "sonner";
import { BellRing, MessageCircleMore, ReceiptText, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { emitDashboardSyncEvent } from "@/lib/dashboard/dashboard-sync";
import { dashboardKeys } from "@/lib/dashboard/dashboard-query-keys";
import { requestDashboardSpaNavigation } from "@/lib/dashboard/dashboard-spa-navigation";
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
  event_id?: string | null;
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
  const queryClient = useQueryClient();
  const preferencesRef = useRef<InAppPreferenceState>(DEFAULT_IN_APP_PREFERENCES);
  const shownEventsRef = useRef(new Set<string>());
  const handleToastAction = useEffectEvent((toastId: string, url: string) => {
    toast.dismiss(toastId);

    if (!requestDashboardSpaNavigation(url)) {
      router.push(url);
    }
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
          console.warn("[dashboard-realtime] Falling back to default notification preferences", {
            code: error.code,
            message: error.message,
          });
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

      emitDashboardSyncEvent({
        eventId: row.event_id ?? null,
        name: "rsvp-responses:inserted",
      });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.responses() });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.home() });

      const hasGuestMessage = Boolean(row.message?.trim());
      const guestName = formatGuestName(row.guest_name);

      if (hasGuestMessage && preferencesRef.current.guest_message) {
        if (!markEventShown(`guest_message:${responseId}`)) return;

        showDashboardToast({
          guestName,
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
        guestName,
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
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.billing() });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.home() });
      if (!preferencesRef.current.billing_update) return;
      const statusChange = getBillingStatusChange(payload);

      if (!statusChange) return;
      if (!markEventShown(`billing_update:${payload.eventType}:${paymentId}:${statusChange}`))
        return;

      showDashboardToast({
        body: "Your payment status was updated.",
        ctaLabel: "View",
        eventType: "billing_update",
        toastKey: `billing_update:${payload.eventType}:${paymentId}:${statusChange}`,
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
      body?: string;
      guestName?: string;
      ctaLabel: string;
      eventType: NotificationEventType;
      toastKey: string;
      title: string;
      url: string;
      variant: "billing" | "guest_message" | "rsvp";
    }) {
      const toastId = input.toastKey;

      const isMessage = input.variant === "guest_message";
      const isRsvp = input.variant === "rsvp";
      const isBilling = input.variant === "billing";

      const iconProps = {
        className: "rsvp-toast-icon size-5 shrink-0 text-[#c96b48]",
        strokeWidth: 2,
        fill: "none",
        "aria-hidden": true,
      };

      const icon = isMessage ? (
        <MessageCircleMore {...iconProps} />
      ) : isRsvp ? (
        <UserRound {...iconProps} />
      ) : isBilling ? (
        <ReceiptText {...iconProps} />
      ) : (
        <BellRing {...iconProps} />
      );

      const messageNode = input.guestName ? (
        <div className="flex min-w-0 items-center gap-1 text-sm font-medium text-[#191311]">
          <span className="shrink-0">{isMessage ? "New message from" : "New RSVP from"}</span>
          <span className="inline-block max-w-[150px] truncate align-bottom font-semibold">
            {input.guestName}
          </span>
        </div>
      ) : (
        <span className="text-sm font-medium text-[#191311]">{input.body}</span>
      );

      toast(messageNode, {
        id: toastId,
        duration: 5200,
        icon,
        action: {
          label: input.ctaLabel,
          onClick: () => handleToastAction(toastId, input.url),
        },
        className: "cn-toast-rsvp-realtime !border-[#ead8c8] !text-[#191311] !shadow-md",
        style: {
          background: "#faf7f2",
        },
      });
    }

    return () => {
      isActive = false;
      window.removeEventListener(DASHBOARD_NOTIFICATION_PREFERENCE_EVENT, handlePreferenceChange);
      cleanupRealtime?.();
    };
  }, [clientId, profileId, queryClient]);

  return null;
}

function isNotificationEventType(value: unknown): value is NotificationEventType {
  return (
    typeof value === "string" && NOTIFICATION_EVENT_TYPES.includes(value as NotificationEventType)
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

function getBillingStatusChange(
  payload: RealtimePostgresChangesPayload<PaymentRealtimeRow>,
): string | null {
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

  return mapPaymentStatusLabel(nextStatus);
}

function mapPaymentStatusLabel(value: string): string {
  switch (value) {
    case "paid":
      return "Confirmed";
    case "pending":
      return "Pending";
    case "refunded":
      return "Refunded";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return formatPaymentStatus(value);
  }
}
