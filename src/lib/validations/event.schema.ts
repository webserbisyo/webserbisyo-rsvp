import { z } from "zod";

export const EventSchema = z.object({});

export type EventInput = z.infer<typeof EventSchema>;
