import { z } from "https://deno.land/x/zod/mod.ts";

/**
 * Standard error response format for validation failures (422)
 */
export const ValidationErrorSchema = z.object({
  error: z.string(),
  code: z.string().default("VALIDATION_ERROR"),
  message: z.string(),
  details: z.array(
    z.object({
      path: z.array(z.string().or(z.number())),
      message: z.string(),
      code: z.string().optional(),
    })
  ).optional(),
});

export type ValidationError = z.infer<typeof ValidationErrorSchema>;

/**
 * Creates a consistent 422 error response
 */
export const createValidationErrorResponse = (error: z.ZodError, headers?: Record<string, string>) => {
  const formattedError: ValidationError = {
    error: "Unprocessable Entity",
    code: "VALIDATION_ERROR",
    message: "A validação dos dados falhou",
    details: error.errors.map((err) => ({
      path: err.path,
      message: err.message,
      code: err.code,
    })),
  };

  return new Response(JSON.stringify(formattedError), {
    status: 422,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
  });
};

/**
 * Standard Webhook Payload schemas
 */
export const WebhookPayloadSchema = z.object({
  event: z.string().optional(),
  EVENT: z.string().optional(),
  data: z.any().optional(),
  DATA: z.any().optional(),
  ts: z.string().optional(),
}).passthrough();

/**
 * Bitrix24 Webhook Schema
 */
export const Bitrix24WebhookSchema = z.object({
  event: z.string().or(z.string().regex(/^ONCRM/)),
  data: z.object({
    FIELDS: z.object({
      ID: z.string().or(z.number()),
    }).passthrough().optional(),
    id: z.string().or(z.number()).optional(),
  }).passthrough().optional(),
  ts: z.string().optional(),
}).passthrough();

/**
 * External Webhook Schema
 */
export const ExternalWebhookSchema = z.object({
  event: z.string(),
  data: z.record(z.any()),
}).passthrough();

/**
 * Webhook Dispatcher Schema
 */
export const WebhookDispatcherSchema = z.object({
  subscription_id: z.string().uuid(),
  event_type: z.string(),
  payload: z.record(z.any()),
});

/**
 * Generic validation helper
 */
export const validatePayload = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error } as const;
  }
  return { success: true, data: result.data } as const;
};
