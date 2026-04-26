import { z } from "zod";

export const ApplicationSchema = z.object({});

export type ApplicationInput = z.infer<typeof ApplicationSchema>;
