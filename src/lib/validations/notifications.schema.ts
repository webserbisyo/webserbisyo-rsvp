import { z } from "zod";
import { NOTIFICATION_EVENT_TYPES } from "@/types/notifications";

export const NotificationEventTypeSchema = z.enum(NOTIFICATION_EVENT_TYPES);

export const UpdateNotificationPreferenceSchema = z.object({
  enabled: z.boolean(),
  eventType: NotificationEventTypeSchema,
});
