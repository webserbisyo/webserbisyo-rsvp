import { z } from "zod";

export const RsvpSubmitSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  responseStatus: z.string().optional(),
  partySize: z.number().optional(),
  message: z.string().optional(),
  _hp: z.string().optional(),
});

export type RsvpSubmitInput = z.infer<typeof RsvpSubmitSchema>;
