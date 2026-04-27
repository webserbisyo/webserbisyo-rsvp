import { z } from "zod";
import { EventTypeSchema } from "./application.schema";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.")
  .optional()
  .or(z.literal("").transform(() => undefined));

const optionalTimestamp = z
  .string()
  .trim()
  .datetime({ offset: true })
  .optional()
  .or(z.literal("").transform(() => undefined));

export const EventSchema = z.object({
  customFrontendEnabled: z.boolean().optional(),
  customFrontendUrl: optionalText(500),
  eventDate: optionalDate,
  eventTime: optionalText(50),
  eventType: EventTypeSchema,
  fallbackPageEnabled: z.boolean().optional(),
  maxGuestCount: z.coerce.number().int().positive().max(10000).optional(),
  rsvpCloseAt: optionalTimestamp,
  rsvpOpenAt: optionalTimestamp,
  status: z.enum(["draft", "setup_in_progress", "ready", "published", "archived"]).optional(),
  title: z.string().trim().min(2).max(250),
  venueAddress: optionalText(500),
  venueName: optionalText(250),
  visibility: z.enum(["private", "public", "unlisted"]).optional(),
});

export const EventContentSchema = z.object({
  contactNote: optionalText(1000),
  contentJson: z.record(z.string(), z.unknown()).optional(),
  coupleOrCelebrantNames: optionalText(250),
  dressCode: optionalText(1000),
  eventStory: optionalText(4000),
  giftNote: optionalText(1000),
  heroSubtitle: optionalText(500),
  heroTitle: optionalText(250),
  rsvpNote: optionalText(1000),
  scheduleNote: optionalText(2000),
  themeKey: optionalText(100),
  venueNote: optionalText(1000),
});

export type EventContentInput = z.infer<typeof EventContentSchema>;
export type EventInput = z.infer<typeof EventSchema>;
