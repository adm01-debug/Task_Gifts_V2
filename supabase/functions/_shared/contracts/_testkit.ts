// Utilitários dos testes de contrato (vitest). Não é importado pelas edge functions.
import { expect } from "vitest";
import {
  type ParsedBody,
  type ValidationError,
  VALIDATION_ERROR_STATUS,
  ValidationErrorSchema,
  validateBody,
  validationErrorResponse,
} from "../validation.ts";
import type { ContractValidation, EdgeContract } from "./common.ts";

/** Request POST JSON para `parseJsonBody`. `body` string é enviado cru (para JSON inválido). */
export function jsonRequest(body: unknown, init: { method?: string; url?: string } = {}): Request {
  const raw = typeof body === "string" ? body : body === undefined ? "" : JSON.stringify(body);
  return new Request(init.url ?? "https://edge.local/fn", {
    method: init.method ?? "POST",
    headers: { "Content-Type": "application/json" },
    body: raw,
  });
}

/** Valida `raw` pelo contrato (customizado quando existir) e devolve o formato comum. */
export function validateWithContract(
  contract: EdgeContract,
  raw: unknown,
  options: { requestId?: string; now?: Date } = {},
): ContractValidation {
  if (contract.validate) return contract.validate(raw, options);
  const r: ParsedBody<unknown> = validateBody(contract.request, raw, { requestId: options.requestId });
  return r.ok ? { ok: true, data: r.data } : { ok: false, error: r.error };
}

/** Garante que `body` está EXATAMENTE no formato único de erro 422. */
export function expectUnifiedValidationError(body: unknown, code = "VALIDATION_ERROR"): ValidationError {
  const parsed = ValidationErrorSchema.safeParse(body);
  expect(parsed.success, `corpo fora do formato 422: ${JSON.stringify(body)}`).toBe(true);
  const err = body as ValidationError;
  expect(err.code).toBe(code);
  expect(err.error).toBe(err.message);
  expect(err.message.length).toBeGreaterThan(0);
  expect(Array.isArray(err.fields)).toBe(true);
  for (const f of err.fields) {
    expect(typeof f.field).toBe("string");
    expect(typeof f.message).toBe("string");
    expect(typeof f.code).toBe("string");
  }
  return err;
}

/** Garante que uma Response é 422 JSON no formato único e devolve o corpo. */
export async function expectValidationResponse(res: Response, code = "VALIDATION_ERROR"): Promise<ValidationError> {
  expect(res.status).toBe(VALIDATION_ERROR_STATUS);
  expect(res.headers.get("content-type")).toContain("application/json");
  const body = await res.json();
  return expectUnifiedValidationError(body, code);
}

export function toResponse(err: ValidationError, headers?: Record<string, string>): Response {
  return validationErrorResponse(err, headers);
}
