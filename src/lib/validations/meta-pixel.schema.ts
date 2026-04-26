import { z } from "zod";

export const MetaPixelSchema = z.object({});

export type MetaPixelInput = z.infer<typeof MetaPixelSchema>;
