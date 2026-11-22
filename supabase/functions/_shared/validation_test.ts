// Testes Deno dos helpers de validação (formato único 422). Rodam no CI pelo workflow deno.yml
// (job "Tipos e testes das Edge Functions"); local: `bun run test:edge` (bunx deno@2 test).
import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import {
  buildValidationError,
  parseJsonBody,
  validateQuery,
  VALIDATION_ERROR_STATUS,
  ValidationErrorSchema,
  z,
} from "./validation.ts";

const Schema = z.object({ id: z.string().uuid(), qty: z.number().int().positive() });

function req(body: string | undefined, url = "https://edge.local/fn"): Request {
  return new Request(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
}

Deno.test("422 — corpo com campo ausente devolve code/message/fields no formato único", async () => {
  const r = await parseJsonBody(req(JSON.stringify({ qty: 2 })), Schema, { headers: { "X-Cors": "1" }, requestId: "r1" });
  assertEquals(r.ok, false);
  if (r.ok) return;
  assertEquals(r.response.status, VALIDATION_ERROR_STATUS);
  assertEquals(r.response.headers.get("x-cors"), "1");
  assertEquals(r.response.headers.get("content-type"), "application/json");
  const body = await r.response.json();
  assertEquals(ValidationErrorSchema.safeParse(body).success, true);
  assertEquals(body.code, "VALIDATION_ERROR");
  assertEquals(body.error, body.message);
  assertEquals(body.requestId, "r1");
  assertEquals(body.fields, [{ field: "id", message: "Required", code: "invalid_type" }]);
});

Deno.test("422 — JSON inválido devolve INVALID_JSON com fields vazio", async () => {
  const r = await parseJsonBody(req("{oops"), Schema);
  assertEquals(r.ok, false);
  if (r.ok) return;
  const body = await r.response.json();
  assertEquals(body.code, "INVALID_JSON");
  assertEquals(body.fields, []);
});

Deno.test("corpo vazio vira {} e passa em schema de corpo opcional", async () => {
  const r = await parseJsonBody(req(undefined), z.object({ userId: z.string().uuid().optional() }));
  assertEquals(r, { ok: true, data: {} });
});

Deno.test("tipo incorreto e valor vazio geram códigos zod estáveis", async () => {
  const r = await parseJsonBody(req(JSON.stringify({ id: "", qty: "2" })), Schema);
  assertEquals(r.ok, false);
  if (r.ok) return;
  const codes = r.error.fields.map((f) => `${f.field}:${f.code}`).sort();
  assertEquals(codes, ["id:invalid_string", "qty:invalid_type"]);
});

Deno.test("validateQuery aplica default e rejeita enum desconhecido", () => {
  const Q = z.object({ action: z.enum(["ping", "credentials"]).default("ping") });
  assertEquals(validateQuery("https://edge.local/fn", Q), { ok: true, data: { action: "ping" } });
  const bad = validateQuery("https://edge.local/fn?action=drop", Q);
  assertEquals(bad.ok, false);
  if (!bad.ok) assertEquals(bad.error.fields[0].code, "invalid_enum_value");
});

Deno.test("buildValidationError sem requestId omite a chave (schema strict)", () => {
  const err = buildValidationError({});
  assertExists(err.message);
  assertEquals("requestId" in err, false);
  assertEquals(ValidationErrorSchema.safeParse(err).success, true);
});
