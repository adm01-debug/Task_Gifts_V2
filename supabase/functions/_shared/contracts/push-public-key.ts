import { defineContract, EmptyBodySchema, z } from "./common.ts";

export const PushPublicKeyResponseSchema = z.object({ publicKey: z.string().nullable() });

export const pushPublicKeyContract = defineContract({
  name: "push-public-key",
  methods: ["GET", "POST"],
  auth: "none",
  request: EmptyBodySchema,
  response: PushPublicKeyResponseSchema,
  bodyRequired: false,
});
