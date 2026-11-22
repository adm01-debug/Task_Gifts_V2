import { defineContract, EmptyBodySchema, z } from "./common.ts";

/** Disparada por pg_cron/net.http_post com segredo interno; sem corpo. */
export const PushOutboxDispatcherResponseSchema = z.object({
  processed: z.number().int().nonnegative(),
  sent: z.number().int().nonnegative().optional(),
  failed: z.number().int().nonnegative().optional(),
  skipped: z.number().int().nonnegative().optional(),
});

export const pushOutboxDispatcherContract = defineContract({
  name: "push-outbox-dispatcher",
  methods: ["POST"],
  auth: "service",
  request: EmptyBodySchema,
  response: PushOutboxDispatcherResponseSchema,
  bodyRequired: false,
});
