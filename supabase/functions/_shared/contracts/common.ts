// Primitivas compartilhadas pelos contratos das edge functions.
// Zod v3 fixado em deno.land (ver ../validation.ts); no vitest a URL vira `zod/v3` por alias.
import { z } from "https://deno.land/x/zod@v3.25/mod.ts";
import type { ValidationError } from "../validation.ts";

export { z };

/** Resultado de validação sem Response (para contratos com lógica própria, ex.: versionamento). */
export type ContractValidation =
  | { ok: true; data: unknown }
  | { ok: false; error: ValidationError };

/** UUID v4 (ids do Supabase/Postgres). */
export const uuid = z.string().uuid();

/** Texto obrigatório, sem espaços nas pontas e com limite explícito. */
export const texto = (max: number, min = 1) => z.string().trim().min(min).max(max);

/** Objeto JSON livre (`Record<string, unknown>`). */
export const jsonRecord = z.record(z.unknown());

/**
 * Contrato de função SEM corpo (GET, cron, chamadas `invoke` sem `body`).
 * Aceita ausência, `null`, `{}` ou objeto qualquer (ignorado); rejeita string, número, array.
 */
export const EmptyBodySchema = z.object({}).passthrough().nullable().optional();
export type EmptyBody = z.infer<typeof EmptyBodySchema>;

/** Métodos HTTP que uma função declara aceitar (OPTIONS é implícito em todas). */
export const HTTP_METHODS = ["GET", "POST"] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

/** Como a função autentica o chamador. */
export type AuthMode =
  | "user" // JWT de sessão do usuário (verifyUser / auth.getUser)
  | "service" // service_role / INTERNAL_FUNCTION_SECRET / CRON_SECRET (verifyServiceRole)
  | "access-key" // header x-access-key (migrate-helper)
  | "none"; // pública (push-public-key)

/** Descrição de um contrato de edge function (request, query, response e versões). */
export interface EdgeContract<
  TRequest extends z.ZodTypeAny = z.ZodTypeAny,
  TQuery extends z.ZodTypeAny = z.ZodTypeAny,
  TResponse extends z.ZodTypeAny = z.ZodTypeAny,
> {
  /** Nome da pasta em supabase/functions/. */
  name: string;
  /** Métodos aceitos além de OPTIONS. */
  methods: readonly HttpMethod[];
  auth: AuthMode;
  /** Schema do corpo JSON. `EmptyBodySchema` quando a função ignora o corpo. */
  request: TRequest;
  /** Schema dos query params (somente quando a função os lê). */
  query?: TQuery;
  /** Schema da resposta 2xx (documentação + testes de forma). */
  response?: TResponse;
  /** Versões de contrato suportadas quando a função é versionada (ex.: webhooks). */
  versions?: readonly string[];
  /** Se o corpo é obrigatório na prática (função devolve 422 sem ele). */
  bodyRequired: boolean;
  /**
   * Validação customizada quando `request.safeParse` não basta (ex.: união versionada, cujo erro
   * zod sairia como `invalid_union` na raiz). Deve devolver o MESMO formato 422 de validation.ts.
   */
  validate?: (raw: unknown, options?: { requestId?: string; now?: Date }) => ContractValidation;
}

export function defineContract<
  TRequest extends z.ZodTypeAny,
  TQuery extends z.ZodTypeAny = z.ZodTypeAny,
  TResponse extends z.ZodTypeAny = z.ZodTypeAny,
>(c: EdgeContract<TRequest, TQuery, TResponse>): EdgeContract<TRequest, TQuery, TResponse> {
  return c;
}
