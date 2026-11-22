import { defineContract, jsonRecord, texto, uuid, z } from "./common.ts";

/** Chamador: src/services/pushSubscriptionService.ts (buildRevocationBroadcast). */
export const PushDeviceRevokedRequestSchema = z.object({
  exclude_subscription_id: uuid,
  title: texto(120),
  message: texto(400),
  url: z.string().max(300).optional(),
  data: jsonRecord.optional(),
});

export const PushDeviceRevokedResponseSchema = z.object({
  sent: z.number().int().nonnegative(),
  targets: z.number().int().nonnegative(),
  invalidated: z.number().int().nonnegative().optional(),
});

export const pushDeviceRevokedContract = defineContract({
  name: "push-device-revoked",
  methods: ["POST"],
  auth: "user",
  request: PushDeviceRevokedRequestSchema,
  response: PushDeviceRevokedResponseSchema,
  bodyRequired: true,
});
