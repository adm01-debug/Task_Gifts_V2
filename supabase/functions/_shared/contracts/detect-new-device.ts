import { defineContract, texto, uuid, z } from "./common.ts";

/**
 * Registro de dispositivo (src/hooks/useDeviceDetection.ts). `userId` do corpo é IGNORADO pelo
 * handler (usa o usuário do JWT) — fica opcional só por compatibilidade com o chamador atual.
 */
export const DetectNewDeviceRequestSchema = z.object({
  userId: uuid.optional(),
  fingerprint: texto(256),
  userAgent: z.string().max(1024),
  browser: z.string().max(128).optional(),
  os: z.string().max(128).optional(),
  deviceType: z.enum(["desktop", "mobile", "tablet"]).optional(),
});

export const DetectNewDeviceResponseSchema = z.object({
  is_new_device: z.boolean(),
  device_id: z.string().nullable().optional(),
  is_trusted: z.boolean(),
});

export const detectNewDeviceContract = defineContract({
  name: "detect-new-device",
  methods: ["POST"],
  auth: "user",
  request: DetectNewDeviceRequestSchema,
  response: DetectNewDeviceResponseSchema,
  bodyRequired: true,
});
