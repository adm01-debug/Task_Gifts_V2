import { defineContract, EmptyBodySchema, z } from "./common.ts";

/** Sem corpo: o IP vem do header confiável do proxy (_shared/clientIp.ts). */
export const VerifyIpResponseSchema = z.object({
  allowed: z.boolean(),
  ip: z.string(),
  reason: z.enum([
    "whitelist_empty",
    "whitelisted",
    "not_whitelisted",
    "untrusted_source_ip",
    "whitelist_check_error",
    "check_error",
    "error",
  ]),
  message: z.string(),
});

export const verifyIpContract = defineContract({
  name: "verify-ip",
  methods: ["GET", "POST"],
  auth: "none",
  request: EmptyBodySchema,
  response: VerifyIpResponseSchema,
  bodyRequired: false,
});
