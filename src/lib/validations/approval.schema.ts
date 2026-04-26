import { z } from "zod";

export const ApprovalSchema = z.object({});

export type ApprovalInput = z.infer<typeof ApprovalSchema>;
