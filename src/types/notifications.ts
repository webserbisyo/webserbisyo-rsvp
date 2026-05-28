export const NOTIFICATION_EVENT_TYPES = [
  "new_rsvp_response",
  "guest_message",
  "billing_update",
] as const;

export type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number];

export type NotificationChannel = "email_future" | "in_app" | "push";

export type SettingsNotificationPreference = {
  emailEnabled: boolean;
  eventType: NotificationEventType;
  inAppEnabled: boolean;
  pushEnabled: boolean;
};

export type PushSubscriptionRecord = {
  auth: string;
  endpoint: string;
  p256dh: string;
};

export type DashboardNotificationPayload = {
  body?: string;
  entityId?: string;
  eventType: NotificationEventType;
  title: string;
  url: string;
};
