import { z } from "zod";

/**
 * Schema for the `/api/analyze` request body.
 * Only a single `url` field is accepted.
 */
export const analyzeRequestSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "A URL é obrigatória.")
    .max(2048, "A URL é muito longa."),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;