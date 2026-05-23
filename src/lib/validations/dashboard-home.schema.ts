import { z } from "zod";

export const UpdateDashboardGuestLimitSchema = z.object({
  eventId: z.uuid(),
  guestLimit: z.coerce.number().int().min(1).max(1000),
});

export type UpdateDashboardGuestLimitInput = z.infer<typeof UpdateDashboardGuestLimitSchema>;
