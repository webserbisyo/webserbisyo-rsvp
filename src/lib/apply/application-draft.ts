import { z } from "zod";

export const APPLY_DRAFT_STORAGE_KEY = "ws-rsvp-apply-draft";

const ApplicationDraftSchema = z.object({
  email: z.string().max(320).optional(),
  estimatedGuestCount: z.union([z.string(), z.number()]).optional(),
  eventDate: z.string().max(10).optional(),
  eventLocation: z.string().max(300).optional(),
  eventType: z.string().max(50).optional(),
  fullName: z.string().max(120).optional(),
  message: z.string().max(500).optional(),
  phone: z.string().max(50).optional(),
  preferredManualPaymentOption: z.string().max(50).optional(),
  preferredPlan: z.string().max(50).optional(),
  step: z.union([z.literal(1), z.literal(2)]).optional(),
});

export type ApplicationDraft = z.infer<typeof ApplicationDraftSchema>;

export function serializeApplicationDraft(draft: ApplicationDraft) {
  return JSON.stringify(ApplicationDraftSchema.parse(draft));
}

export function parseApplicationDraft(value: string | null): ApplicationDraft | null {
  if (!value) return null;

  try {
    const parsed = ApplicationDraftSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
