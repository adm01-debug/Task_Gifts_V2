// Versão FIXADA: sem versão, cada execução baixava o zod mais novo (comportamento imprevisível e risco de
// cadeia de suprimentos). v3.25 é a que já resolvia em 12/11/2026 — comportamento inalterado.
// No vitest, esta URL é resolvida para `zod/v3` (alias em vitest.config.ts), então os testes de contrato
// rodam no CI sem Deno; no Deno a URL é usada como está.
import { z } from "https://deno.land/x/zod@v3.25/mod.ts";

/**
 * FORMATO ÚNICO de erro de validação (HTTP 422) de TODAS as edge functions.
 *
 *   { error, code, message, fields: [{ field, message, code }], requestId? }
 *
 * - `code`    : estável, para máquina (`VALIDATION_ERROR` | `INVALID_JSON` | `UNSUPPORTED_VERSION`).
 * - `message` : PT-BR, resume a falha.
 * - `fields`  : um item por campo inválido; `field` em notação de caminho ("user_ids.2", "data.id").
 *               Vazio quando a falha não é de campo (JSON inválido).
 * - `error`   : igual a `message`. Mantido porque o front lê `payload.error ?? payload.message`
 *               (src/lib/edgeErrors.ts) para montar a mensagem exibida ao usuário.
 */
export const VALIDATION_ERROR_CODES = ["VALIDATION_ERROR", "INVALID_JSON", "UNSUPPORTED_VERSION"] as const;
export type ValidationErrorCode = (typeof VALIDATION_ERROR_CODES)[number];

export const ValidationErrorFieldSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string(),
});

export const ValidationErrorSchema = z.object({
  error: z.string(),
  code: z.enum(VALIDATION_ERROR_CODES),
  message: z.string(),
  fields: z.array(ValidationErrorFieldSchema),
  requestId: z.string().optional(),
}).strict();

export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type ValidationErrorField = z.infer<typeof ValidationErrorFieldSchema>;

export const VALIDATION_ERROR_STATUS = 422;

/** Converte `path` do zod ("a", 2, "b") em "a.2.b"; raiz vira "(body)". */
export function formatFieldPath(path: ReadonlyArray<string | number>): string {
  return path.length === 0 ? "(body)" : path.map(String).join(".");
}

/** Transforma um ZodError na lista de campos do formato único (sem duplicatas de field+code). */
export function zodIssuesToFields(error: z.ZodError): ValidationErrorField[] {
  const out: ValidationErrorField[] = [];
  const seen = new Set<string>();
  for (const issue of error.issues) {
    const field = formatFieldPath(issue.path);
    const key = `${field}|${issue.code}|${issue.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ field, message: issue.message, code: issue.code });
  }
  return out;
}

/** Monta o corpo do erro 422 — função pura, testável sem Response. */
export function buildValidationError(params: {
  code?: ValidationErrorCode;
  message?: string;
  fields?: ValidationErrorField[];
  requestId?: string;
}): ValidationError {
  const fields = params.fields ?? [];
  const code = params.code ?? "VALIDATION_ERROR";
  const message = params.message ?? defaultMessage(code, fields);
  const body: ValidationError = { error: message, code, message, fields };
  if (params.requestId) body.requestId = params.requestId;
  return body;
}

function defaultMessage(code: ValidationErrorCode, fields: ValidationErrorField[]): string {
  if (code === "INVALID_JSON") return "Corpo da requisição não é JSON válido";
  if (code === "UNSUPPORTED_VERSION") return "Versão de contrato não suportada";
  const n = fields.length;
  return n === 0
    ? "A validação dos dados falhou"
    : `A validação dos dados falhou: ${n} campo(s) inválido(s)`;
}

/** Response 422 pronta, com CORS/headers extras e Content-Type JSON. */
export function validationErrorResponse(
  body: ValidationError,
  headers?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status: VALIDATION_ERROR_STATUS,
    headers: { ...(headers ?? {}), "Content-Type": "application/json" },
  });
}

/**
 * Cria a resposta 422 a partir de um ZodError (compatível com o uso anterior em webhook-dispatcher).
 */
export const createValidationErrorResponse = (
  error: z.ZodError,
  headers?: Record<string, string>,
  requestId?: string,
): Response =>
  validationErrorResponse(
    buildValidationError({ code: "VALIDATION_ERROR", fields: zodIssuesToFields(error), requestId }),
    headers,
  );

/** Validação pura: `{ success, data }` ou `{ success:false, error }`. */
export const validatePayload = <S extends z.ZodTypeAny>(schema: S, data: unknown) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error } as const;
  }
  return { success: true, data: result.data as z.output<S> } as const;
};

/**
 * Resultado de `parseJsonBody`: ou os dados tipados, ou a Response 422 já pronta
 * para devolver (`if (!parsed.ok) return parsed.response;`).
 */
export type ParsedBody<T> =
  | { ok: true; data: T }
  | { ok: false; response: Response; error: ValidationError };

/**
 * Lê e valida o corpo JSON de uma Request contra um schema zod.
 * - corpo vazio → `{}` quando `emptyAsObject` (padrão true), para funções cujo corpo é opcional;
 * - JSON inválido → 422 `INVALID_JSON`;
 * - schema falha → 422 `VALIDATION_ERROR` com `fields`.
 * Nunca lança por entrada do cliente.
 */
export async function parseJsonBody<S extends z.ZodTypeAny>(
  req: Request,
  schema: S,
  options: { headers?: Record<string, string>; requestId?: string; emptyAsObject?: boolean } = {},
): Promise<ParsedBody<z.output<S>>> {
  const { headers, requestId, emptyAsObject = true } = options;
  let raw: unknown;
  try {
    const text = await req.text();
    raw = text.trim() === "" && emptyAsObject ? {} : JSON.parse(text);
  } catch {
    const error = buildValidationError({ code: "INVALID_JSON", requestId });
    return { ok: false, error, response: validationErrorResponse(error, headers) };
  }
  return validateBody(schema, raw, { headers, requestId });
}

/** Mesma coisa de `parseJsonBody`, para quem já tem o valor parseado. */
export function validateBody<S extends z.ZodTypeAny>(
  schema: S,
  raw: unknown,
  options: { headers?: Record<string, string>; requestId?: string } = {},
): ParsedBody<z.output<S>> {
  const result = schema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data as z.output<S> };
  const error = buildValidationError({
    code: "VALIDATION_ERROR",
    fields: zodIssuesToFields(result.error),
    requestId: options.requestId,
  });
  return { ok: false, error, response: validationErrorResponse(error, options.headers) };
}

/** Valida os query params (URLSearchParams → objeto chave/valor) contra um schema. */
export function validateQuery<S extends z.ZodTypeAny>(
  url: URL | string,
  schema: S,
  options: { headers?: Record<string, string>; requestId?: string } = {},
): ParsedBody<z.output<S>> {
  const u = typeof url === "string" ? new URL(url) : url;
  const raw: Record<string, string> = {};
  u.searchParams.forEach((value, key) => {
    raw[key] = value;
  });
  return validateBody(schema, raw, options);
}

export { z };
