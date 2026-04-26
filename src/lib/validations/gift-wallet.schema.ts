import { z } from "zod";

export const GiftWalletSchema = z.object({});

export type GiftWalletInput = z.infer<typeof GiftWalletSchema>;
