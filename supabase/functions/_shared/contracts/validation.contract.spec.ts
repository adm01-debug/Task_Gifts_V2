import { describe, it, expect } from "vitest";
import {
  buildValidationError,
  createValidationErrorResponse,
  formatFieldPath,
  parseJsonBody,
  validateBody,
  validatePayload,
  validateQuery,
  VALIDATION_ERROR_CODES,
  VALIDATION_ERROR_STATUS,
  ValidationErrorSchema,
  zodIssuesToFields,
  z,
} from "../validation.ts";
import { expectUnifiedValidationError, expectValidationResponse, jsonRequest } from "./_testkit.ts";

const Schema = z.object({
  id: z.string().uuid(),
  qty: z.number().int().positive(),
  tags: z.array(z.string().min(1)).optional(),
});

describe("formato único de erro 422 (validation.ts)", () => {
  it("status é 422 e os códigos são estáveis", () => {
    expect(VALIDATION_ERROR_STATUS).toBe(422);
    expect([...VALIDATION_ERROR_CODES]).toEqual(["VALIDATION_ERROR", "INVALID_JSON", "UNSUPPORTED_VERSION"]);
  });

  it("buildValidationError: código, mensagem e lista de campos; error == message (compat front)", () => {
    const err = buildValidationError({
      fields: [{ field: "qty", message: "Required", code: "invalid_type" }],
      requestId: "req-1",
    });
    expectUnifiedValidationError(err);
    expect(err).toEqual({
      error: "A validação dos dados falhou: 1 campo(s) inválido(s)",
      code: "VALIDATION_ERROR",
      message: "A validação dos dados falhou: 1 campo(s) inválido(s)",
      fields: [{ field: "qty", message: "Required", code: "invalid_type" }],
      requestId: "req-1",
    });
  });

  it("buildValidationError sem requestId não inclui a chave (schema strict)", () => {
    const err = buildValidationError({ code: "INVALID_JSON" });
    expect("requestId" in err).toBe(false);
    expect(err.fields).toEqual([]);
    expect(err.message).toBe("Corpo da requisição não é JSON válido");
    expect(ValidationErrorSchema.strict().safeParse(err).success).toBe(true);
  });

  it("schema do erro é strict: chave extra é rejeitada (nenhuma função pode inventar campo)", () => {
    const err = { ...buildValidationError({}), details: [] };
    expect(ValidationErrorSchema.safeParse(err).success).toBe(false);
  });

  it("formatFieldPath: caminho com índices e raiz", () => {
    expect(formatFieldPath([])).toBe("(body)");
    expect(formatFieldPath(["user_ids", 2])).toBe("user_ids.2");
    expect(formatFieldPath(["event", "type"])).toBe("event.type");
  });

  it("zodIssuesToFields: um item por campo, sem duplicatas, com código zod", () => {
    const r = Schema.safeParse({ id: "x", qty: -1.5, tags: [""] });
    expect(r.success).toBe(false);
    if (r.success) return;
    const fields = zodIssuesToFields(r.error);
    const byField = Object.fromEntries(fields.map((f) => [f.field + ":" + f.code, f]));
    expect(byField["id:invalid_string"]).toBeDefined();
    expect(byField["qty:invalid_type"]).toBeDefined(); // não inteiro
    expect(byField["qty:too_small"]).toBeDefined(); // não positivo
    expect(byField["tags.0:too_small"]).toBeDefined();
    expect(new Set(fields.map((f) => `${f.field}|${f.code}|${f.message}`)).size).toBe(fields.length);
  });

  it("validateBody devolve Response 422 pronta + corpo tipado em caso de sucesso", async () => {
    const ok = validateBody(Schema, { id: "8d6f2b1e-3c4a-4e5f-9a7b-1c2d3e4f5a6b", qty: 2 });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.data.qty).toBe(2);

    const bad = validateBody(Schema, { qty: "2" }, { headers: { "Access-Control-Allow-Origin": "*" }, requestId: "r2" });
    expect(bad.ok).toBe(false);
    if (bad.ok) return;
    expect(bad.response.headers.get("access-control-allow-origin")).toBe("*");
    const body = await expectValidationResponse(bad.response);
    expect(body.requestId).toBe("r2");
    expect(body.fields).toEqual(
      expect.arrayContaining([
        { field: "id", message: "Required", code: "invalid_type" },
        { field: "qty", message: expect.any(String), code: "invalid_type" },
      ]),
    );
  });

  it("parseJsonBody: JSON inválido → 422 INVALID_JSON com fields vazio", async () => {
    const r = await parseJsonBody(jsonRequest("{not json"), Schema, { requestId: "r3" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const body = await expectValidationResponse(r.response, "INVALID_JSON");
    expect(body.fields).toEqual([]);
    expect(body.requestId).toBe("r3");
  });

  it("parseJsonBody: corpo vazio vira {} por padrão (funções de corpo opcional)", async () => {
    const Opt = z.object({ userId: z.string().uuid().optional() });
    const r = await parseJsonBody(jsonRequest(undefined), Opt);
    expect(r).toEqual({ ok: true, data: {} });
  });

  it("parseJsonBody: corpo vazio com emptyAsObject=false → INVALID_JSON", async () => {
    const r = await parseJsonBody(jsonRequest(undefined), Schema, { emptyAsObject: false });
    expect(r.ok).toBe(false);
    if (!r.ok) await expectValidationResponse(r.response, "INVALID_JSON");
  });

  it("parseJsonBody: corpo válido devolve dados com defaults aplicados", async () => {
    const WithDefault = z.object({ n: z.number().default(5) });
    const r = await parseJsonBody(jsonRequest({}), WithDefault);
    expect(r).toEqual({ ok: true, data: { n: 5 } });
  });

  it("parseJsonBody: tipos primitivos no lugar do objeto → field (body)", async () => {
    for (const raw of ['"texto"', "42", "[1,2]", "null"]) {
      const r = await parseJsonBody(jsonRequest(raw), Schema);
      expect(r.ok).toBe(false);
      if (r.ok) continue;
      const body = await expectValidationResponse(r.response);
      expect(body.fields[0].field).toBe("(body)");
      expect(body.fields[0].code).toBe("invalid_type");
    }
  });

  it("validateQuery: query params validados com default e enum", () => {
    const Q = z.object({ action: z.enum(["ping", "credentials"]).default("ping") });
    expect(validateQuery("https://edge.local/fn", Q)).toEqual({ ok: true, data: { action: "ping" } });
    expect(validateQuery(new URL("https://edge.local/fn?action=credentials"), Q)).toEqual({ ok: true, data: { action: "credentials" } });
    const bad = validateQuery("https://edge.local/fn?action=drop", Q);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error.fields).toEqual([{ field: "action", message: expect.any(String), code: "invalid_enum_value" }]);
  });

  it("createValidationErrorResponse e validatePayload mantêm compatibilidade com o uso antigo", async () => {
    const v = validatePayload(Schema, { id: 1 });
    expect(v.success).toBe(false);
    if (v.success) return;
    const res = createValidationErrorResponse(v.error, { "X-Test": "1" }, "r9");
    expect(res.headers.get("x-test")).toBe("1");
    const body = await expectValidationResponse(res);
    expect(body.requestId).toBe("r9");
  });
});
