export const NOTIFICATION_EVENT_TYPES = [
  "new_rsvp_response",
  "guest_message",
  "billing_update",
] as const;

export const DASHBOARD_NOTIFICATION_PREFERENCE_EVENT = "dashboard-notification-preference-change";

export type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number];

export type NotificationChannel = "email_future" | "in_app" | "push";

export type SettingsNotificationPreference = {
  emailEnabled: boolean;
  eventType: NotificationEventType;
  inAppEnabled: boolean;
  pushEnabled: boolean;
};

export type PushPermissionState = "blocked" | "default" | "granted" | "unsupported";

export type PushSubscriptionStatus = "blocked" | "not_configured" | "off" | "on" | "unsupported";

export type PushSubscriptionRecord = {
  auth: string;
  endpoint: string;
  p256dh: string;
};

export type PushSubscriptionActionInput = {
  auth: string;
  endpoint: string;
  p256dh: string;
  platform?: string | null;
  userAgent?: string | null;
};

export type DashboardNotificationPayload = {
  body?: string;
  entityId?: string;
  eventType: NotificationEventType;
  title: string;
  url: string;
};

export type DashboardNotificationPreferenceEventDetail = {
  eventType: NotificationEventType;
  inAppEnabled: boolean;
};
