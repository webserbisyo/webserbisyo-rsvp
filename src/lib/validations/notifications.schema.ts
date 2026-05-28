import { z } from "zod";
import { NOTIFICATION_EVENT_TYPES } from "@/types/notifications";

export const NotificationEventTypeSchema = z.enum(NOTIFICATION_EVENT_TYPES);

export const UpdateNotificationPreferenceSchema = z.object({
  enabled: z.boolean(),
  eventType: NotificationEventTypeSchema,
});

export const SavePushSubscriptionSchema = z.object({
  auth: z.string().min(1).max(512),
  endpoint: z.url().max(2048),
  p256dh: z.string().min(1).max(512),
  platform: z.string().trim().max(80).optional().nullable(),
  userAgent: z.string().trim().max(512).optional().nullable(),
});

export const RemovePushSubscriptionSchema = z.object({
  endpoint: z.url().max(2048),
});
