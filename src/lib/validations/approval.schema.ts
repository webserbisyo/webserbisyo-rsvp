import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

export const ReviewApplicationSchema = z.object({
  applicationId: z.uuid(),
  reviewNotes: optionalText(2000),
  status: z.enum(["reviewing", "rejected"]),
});

export type ReviewApplicationInput = z.infer<typeof ReviewApplicationSchema>;
