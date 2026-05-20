import { z } from "https://deno.land/x/zod/mod.ts";

export const WebhookPayloadSchema = z.object({
  event: z.string().optional(),
  EVENT: z.string().optional(),
  data: z.any().optional(),
  DATA: z.any().optional(),
  ts: z.string().optional(),
}).passthrough();

export const validatePayload = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`);
  }
  return result.data;
};
