import { buildValidationError, type ValidationErrorField, zodIssuesToFields } from "../validation.ts";
import { defineContract, uuid, z } from "./common.ts";

/**
 * Corpo do POST em `passkey-auth`. Duas ações no mesmo endpoint:
 *  - `options`: pede challenge (o `email` é opcional e só restringe credenciais);
 *  - `verify`: devolve a asserção crua do autenticador para verificação.
 */
export const PasskeyAuthRequestSchema = z.object({
  action: z.enum(["options", "verify"]),
  email: z.string().trim().email().max(255).optional(),
  credentialId: z.string().trim().max(2048).optional(),
  authenticatorData: z.string().trim().max(8192).optional(),
  clientDataJSON: z.string().trim().max(8192).optional(),
  signature: z.string().trim().max(8192).optional(),
});
export type PasskeyAuthRequest = z.infer<typeof PasskeyAuthRequestSchema>;

/** Campos que só existem no passo `verify`. */
const VERIFY_FIELDS = ["credentialId", "authenticatorData", "clientDataJSON", "signature"] as const;

export const PasskeyOptionsResponseSchema = z.object({
  ok: z.literal(true),
  challenge: z.string().min(1),
  rpId: z.string().min(1),
  allowCredentials: z.array(z.object({ id: z.string(), type: z.literal("public-key") })),
  timeout: z.number().int().positive(),
  userVerification: z.literal("required"),
});

/** O token de sessão só é devolvido ao cliente depois da assinatura validada. */
export const PasskeyVerifyResponseSchema = z.object({
  ok: z.literal(true),
  tokenHash: z.string().min(1),
  email: z.string().email(),
  userId: uuid,
});

export const PasskeyAuthResponseSchema = z.union([
  PasskeyOptionsResponseSchema,
  PasskeyVerifyResponseSchema,
]);

export const passkeyAuthContract = defineContract({
  name: "passkey-auth",
  methods: ["POST"],
  auth: "none",
  request: PasskeyAuthRequestSchema,
  response: PasskeyAuthResponseSchema,
  bodyRequired: true,
  validate: (raw, options) => {
    const parsed = PasskeyAuthRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: buildValidationError({
          fields: zodIssuesToFields(parsed.error),
          requestId: options?.requestId,
        }),
      };
    }

    // `zod` não expressa "obrigatório apenas quando action=verify" sem união
    // discriminada, cujo erro sairia como invalid_union na raiz (sem o campo).
    if (parsed.data.action === "verify") {
      const fields: ValidationErrorField[] = [];
      for (const field of VERIFY_FIELDS) {
        const value = parsed.data[field];
        if (typeof value !== "string" || value === "") {
          fields.push({
            field,
            code: "too_small",
            message: "String must contain at least 1 character(s)",
          });
        }
      }
      if (fields.length > 0) {
        return { ok: false, error: buildValidationError({ fields, requestId: options?.requestId }) };
      }
    }

    return { ok: true, data: parsed.data };
  },
});