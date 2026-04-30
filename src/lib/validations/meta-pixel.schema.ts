import { z } from "zod";

export const META_PIXEL_TRACKING_SCOPE_VALUES = [
  "global_public",
  "application",
  "event_page",
  "rsvp_submit",
  "event",
  "disabled",
] as const;

export const MetaPixelSchema = z
  .object({
    accessTokenEncrypted: z.string().trim().max(4000).optional(),
    eventId: z.uuid().optional(),
    name: z.string().trim().min(1, "Pixel name is required.").max(120),
    notes: z.string().trim().max(1000).optional(),
    isActive: z.boolean().optional(),
    pixelId: z
      .string()
      .trim()
      .regex(/^\d{5,30}$/, "Enter a numeric Meta Pixel ID."),
    trackingScope: z.enum(META_PIXEL_TRACKING_SCOPE_VALUES).default("global_public"),
  })
  .superRefine((value, ctx) => {
    if (value.trackingScope === "event" && !value.eventId) {
      ctx.addIssue({
        code: "custom",
        message: "Event-level pixels require an event.",
        path: ["eventId"],
      });
    }

    if (value.trackingScope !== "event" && value.eventId) {
      ctx.addIssue({
        code: "custom",
        message: "Only event-level pixels can be tied to an event.",
        path: ["eventId"],
      });
    }
  });

export type MetaPixelInput = z.infer<typeof MetaPixelSchema>;
