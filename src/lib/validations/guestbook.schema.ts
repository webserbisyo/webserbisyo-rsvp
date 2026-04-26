import { z } from "zod";

export const GuestbookSchema = z.object({});

export type GuestbookInput = z.infer<typeof GuestbookSchema>;
