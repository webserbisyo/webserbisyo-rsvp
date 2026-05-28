"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  NOTIFICATION_EVENT_TYPES,
  type NotificationEventType,
} from "@/types/notifications";

type DashboardRealtimeNotificationsProps = {
  clientId: string;
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
}: DashboardRealtimeNotificationsProps) {
  const router = useRouter();
  const preferencesRef = useRef<InAppPreferenceState>(DEFAULT_IN_APP_PREFERENCES);
  const shownEventsRef = useRef(new Set<string>());

  useEffect(() => {
    let isActive = true;
    const supabase = createClient();

    async function startRealtime() {
      const { data: preferences, error } = await supabase
        .from("notification_preferences")
        .select("event_type, in_app_enabled")
        .eq("client_id", clientId);

      if (!isActive) return;

      if (error) {
        console.error("[dashboard-realtime] Failed to load notification preferences", error);
        return;
      }

      preferencesRef.current = {
        ...DEFAULT_IN_APP_PREFERENCES,
        ...Object.fromEntries(
          (preferences ?? [])
            .filter((row) =>
              NOTIFICATION_EVENT_TYPES.includes(row.event_type as NotificationEventType),
            )
            .map((row) => [row.event_type, row.in_app_enabled]),
        ),
      } as InAppPreferenceState;

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
            event: "*",
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
      const eventType: NotificationEventType =
        preferencesRef.current.new_rsvp_response || !hasGuestMessage
          ? "new_rsvp_response"
          : "guest_message";

      if (!preferencesRef.current[eventType]) return;
      if (!markEventShown(`${eventType}:${responseId}`)) return;

      if (eventType === "guest_message") {
        showDashboardToast({
          description: "Open RSVP responses to review it.",
          eventType,
          title: "New guest message received",
          url: "/dashboard/responses",
        });
        return;
      }

      const guestName = row.guest_name?.trim() || "A guest";
      const partySize = row.party_size && row.party_size > 1 ? `Party of ${row.party_size}` : null;
      const attendance =
        row.attendance_status === "attending"
          ? "Attending"
          : row.attendance_status === "not_attending"
            ? "Not attending"
            : null;

      showDashboardToast({
        description: [attendance, partySize].filter(Boolean).join(" · ") || "Open RSVP responses.",
        eventType,
        title: `${guestName} submitted an RSVP`,
        url: "/dashboard/responses",
      });
    }

    function handlePaymentChange(payload: RealtimePostgresChangesPayload<PaymentRealtimeRow>) {
      const row = payload.new as PaymentRealtimeRow;
      const paymentId = row.id;

      if (!paymentId || row.client_id !== clientId) return;
      if (!preferencesRef.current.billing_update) return;
      if (!markEventShown(`billing_update:${payload.eventType}:${paymentId}`)) return;

      showDashboardToast({
        description: row.payment_status ? `Status: ${formatPaymentStatus(row.payment_status)}` : undefined,
        eventType: "billing_update",
        title: payload.eventType === "INSERT" ? "New billing update" : "Billing status updated",
        url: "/dashboard/billing",
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
      description?: string;
      eventType: NotificationEventType;
      title: string;
      url: string;
    }) {
      toast(input.title, {
        action: {
          label: "Open",
          onClick: () => router.push(input.url),
        },
        description: input.description,
        id: `${input.eventType}:${input.title}:${input.description ?? ""}`,
      });
    }

    return () => {
      isActive = false;
      cleanupRealtime?.();
    };
  }, [clientId, router]);

  return null;
}

function formatPaymentStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
