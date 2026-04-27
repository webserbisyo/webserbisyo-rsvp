import { z } from "zod";

export const MetaPixelSchema = z
  .object({
    accessTokenEncrypted: z.string().trim().max(4000).optional(),
    clientId: z.uuid().optional(),
    eventId: z.uuid().optional(),
    isActive: z.boolean().optional(),
    pixelId: z.string().trim().min(5).max(100),
    trackingScope: z.enum(["platform", "client", "event"]).default("platform"),
  })
  .superRefine((value, ctx) => {
    if (value.trackingScope === "platform" && (value.clientId || value.eventId)) {
      ctx.addIssue({
        code: "custom",
        message: "Platform pixels cannot be tied to a client or event.",
        path: ["trackingScope"],
      });
    }

    if (value.trackingScope === "client" && (!value.clientId || value.eventId)) {
      ctx.addIssue({
        code: "custom",
        message: "Client pixels require clientId and must not set eventId.",
        path: ["clientId"],
      });
    }

    if (value.trackingScope === "event" && !value.eventId) {
      ctx.addIssue({
        code: "custom",
        message: "Event pixels require eventId.",
        path: ["eventId"],
      });
    }
  });

export type MetaPixelInput = z.infer<typeof MetaPixelSchema>;
