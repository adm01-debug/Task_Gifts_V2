import { describe, it, expect } from "vitest";
import {
  buildDeliveryEnvelope,
  detectWebhookVersion,
  isWebhookV1Sunset,
  resolveWebhookDispatch,
  WEBHOOK_CONTRACT_VERSIONS,
  WEBHOOK_CURRENT_VERSION,
  WEBHOOK_DEPRECATION_DOC_URL,
  WEBHOOK_V1_DEPRECATED_SINCE,
  WEBHOOK_V1_SUNSET,
  webhookDeprecationHeaders,
  WebhookDeliveryEnvelopeSchema,
  WebhookDispatchRequestSchema,
  webhookDispatcherContract,
} from "./webhook-dispatcher.ts";
import { UUID_A } from "./_fixtures/types.ts";
import { expectUnifiedValidationError } from "./_testkit.ts";

const ANTES = new Date("2026-11-22T12:00:00Z");
const DEPOIS = new Date(WEBHOOK_V1_SUNSET.getTime() + 1000);

const v1 = { subscription_id: UUID_A, event_type: "order.created", payload: { order_id: 10 } };
const v2 = { version: "v2", subscription_id: UUID_A, event: { type: "order.created" }, payload: { order_id: 10 } };

describe("webhook-dispatcher — versionamento v1/v2", () => {
  it("versões declaradas no contrato: v1 e v2; atual = v2; sunset no futuro em relação à data de criação", () => {
    expect([...WEBHOOK_CONTRACT_VERSIONS]).toEqual(["v1", "v2"]);
    expect(WEBHOOK_CURRENT_VERSION).toBe("v2");
    expect(webhookDispatcherContract.versions).toEqual(["v1", "v2"]);
    expect(WEBHOOK_V1_SUNSET.getTime()).toBeGreaterThan(ANTES.getTime());
    expect(isWebhookV1Sunset(ANTES)).toBe(false);
    expect(isWebhookV1Sunset(DEPOIS)).toBe(true);
  });

  it("detecta a versão pelo campo version (ausente ou \"v1\" = v1)", () => {
    expect(detectWebhookVersion(v1)).toBe("v1");
    expect(detectWebhookVersion({ ...v1, version: "v1" })).toBe("v1");
    expect(detectWebhookVersion(v2)).toBe("v2");
    expect(detectWebhookVersion({ ...v1, version: "v3" })).toBe("unknown");
    expect(detectWebhookVersion({ ...v1, version: 2 })).toBe("unknown");
    expect(detectWebhookVersion("texto")).toBe("unknown");
    expect(detectWebhookVersion(null)).toBe("unknown");
    expect(detectWebhookVersion([v1])).toBe("unknown");
  });

  it("v1 com version declarada explicitamente é aceita e tratada como v1 (não 422)", () => {
    const r = resolveWebhookDispatch({ ...v1, version: "v1" }, { now: ANTES });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.version).toBe("v1");
    expect(r.deprecated).toBe(true);
    expect(r.data.event_type).toBe("order.created");
    // e continua produzindo o envelope histórico, sem vazar o campo version para o assinante
    expect(Object.keys(buildDeliveryEnvelope(r.data, "2026-11-22T12:00:00.000Z")).sort()).toEqual(["data", "event", "timestamp"]);
  });

  it("compatibilidade retroativa: v1 e v2 equivalentes normalizam para o mesmo dispatch", () => {
    const r1 = resolveWebhookDispatch(v1, { now: ANTES });
    const r2 = resolveWebhookDispatch(v2, { now: ANTES });
    expect(r1.ok && r2.ok).toBe(true);
    if (!r1.ok || !r2.ok) return;
    const { version: _a, ...d1 } = r1.data;
    const { version: _b, ...d2 } = r2.data;
    expect(d1).toEqual(d2);
    expect(r1.data.version).toBe("v1");
    expect(r2.data.version).toBe("v2");
    expect(r1.deprecated).toBe(true);
    expect(r2.deprecated).toBe(false);
  });

  it("v1 continua aceita antes do sunset, com headers Deprecation/Sunset/Link", () => {
    const r = resolveWebhookDispatch(v1, { now: ANTES });
    expect(r.ok).toBe(true);
    expect(r.headers["X-Contract-Version"]).toBe("v1");
    // RFC 9745: Deprecation = quando ficou depreciada (passado); Sunset = quando deixa de valer.
    expect(r.headers.Deprecation).toBe(`@${Math.floor(WEBHOOK_V1_DEPRECATED_SINCE.getTime() / 1000)}`);
    expect(WEBHOOK_V1_DEPRECATED_SINCE.getTime()).toBeLessThan(WEBHOOK_V1_SUNSET.getTime());
    expect(r.headers.Sunset).toBe(WEBHOOK_V1_SUNSET.toUTCString());
    expect(r.headers.Link).toBe(`<${WEBHOOK_DEPRECATION_DOC_URL}>; rel="deprecation"`);
  });

  it("v2 não recebe headers de depreciação", () => {
    const r = resolveWebhookDispatch(v2, { now: ANTES });
    expect(r.ok).toBe(true);
    expect(r.headers).toEqual({ "X-Contract-Version": "v2" });
    expect(webhookDeprecationHeaders("v2")).toEqual({ "X-Contract-Version": "v2" });
  });

  it("depois do sunset, v1 é recusada com 422 UNSUPPORTED_VERSION (e v2 segue aceita)", () => {
    const r = resolveWebhookDispatch(v1, { now: DEPOIS, requestId: "r-sunset" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const err = expectUnifiedValidationError(r.error, "UNSUPPORTED_VERSION");
    expect(err.fields).toEqual([{ field: "version", message: expect.stringContaining("v2"), code: "sunset" }]);
    expect(err.requestId).toBe("r-sunset");
    expect(r.headers.Sunset).toBeDefined();
    expect(resolveWebhookDispatch(v2, { now: DEPOIS }).ok).toBe(true);
  });

  it("versão desconhecida → 422 UNSUPPORTED_VERSION listando as suportadas", () => {
    const r = resolveWebhookDispatch({ ...v1, version: "v3" }, { now: ANTES });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const err = expectUnifiedValidationError(r.error, "UNSUPPORTED_VERSION");
    expect(err.fields[0]).toEqual({ field: "version", message: expect.stringContaining("v1, v2"), code: "invalid_enum_value" });
    expect(r.headers["X-Contract-Version"]).toBe("v2");
  });

  it("erros de campo em v1 e v2 saem no formato único com caminho aninhado em v2", () => {
    const r1 = resolveWebhookDispatch({ subscription_id: "x", event_type: "a.b", payload: {} }, { now: ANTES });
    const r2 = resolveWebhookDispatch({ version: "v2", subscription_id: UUID_A, event: { type: 7 }, payload: {} }, { now: ANTES });
    expect(r1.ok || r2.ok).toBe(false);
    if (r1.ok || r2.ok) return;
    expect(expectUnifiedValidationError(r1.error).fields).toEqual([{ field: "subscription_id", message: expect.any(String), code: "invalid_string" }]);
    expect(expectUnifiedValidationError(r2.error).fields).toEqual([{ field: "event.type", message: expect.any(String), code: "invalid_type" }]);
  });

  it("v1 é strict: campo extra (ex.: metadata, que só existe em v2) é rejeitado com orientação", () => {
    const r = resolveWebhookDispatch({ ...v1, metadata: { a: 1 } }, { now: ANTES });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.fields[0]).toEqual({ field: "(body)", message: expect.any(String), code: "unrecognized_keys" });
  });

  it("a união do contrato aceita ambas as versões (documentação/geração de tipos)", () => {
    expect(WebhookDispatchRequestSchema.safeParse(v1).success).toBe(true);
    expect(WebhookDispatchRequestSchema.safeParse(v2).success).toBe(true);
    expect(WebhookDispatchRequestSchema.safeParse({}).success).toBe(false);
  });

  it("envelope entregue ao assinante: v1 produz EXATAMENTE o formato antigo {event,timestamp,data}", () => {
    const r = resolveWebhookDispatch(v1, { now: ANTES });
    if (!r.ok) throw new Error("v1 deveria ser válido");
    const env = buildDeliveryEnvelope(r.data, "2026-11-22T12:00:00.000Z");
    expect(env).toEqual({ event: "order.created", timestamp: "2026-11-22T12:00:00.000Z", data: { order_id: 10 } });
    expect(WebhookDeliveryEnvelopeSchema.safeParse(env).success).toBe(true);
  });

  it("envelope para v2 é aditivo: id/occurred_at/metadata só quando informados", () => {
    const full = { ...v2, event: { type: "order.created", id: "evt_9", occurred_at: "2026-11-22T11:59:00Z" }, metadata: { source: "erp" } };
    const r = resolveWebhookDispatch(full, { now: ANTES });
    if (!r.ok) throw new Error("v2 deveria ser válido");
    const env = buildDeliveryEnvelope(r.data, "2026-11-22T12:00:00.000Z");
    expect(env).toEqual({
      event: "order.created",
      timestamp: "2026-11-22T12:00:00.000Z",
      data: { order_id: 10 },
      id: "evt_9",
      occurred_at: "2026-11-22T11:59:00Z",
      metadata: { source: "erp" },
    });
    expect(WebhookDeliveryEnvelopeSchema.safeParse(env).success).toBe(true);
    const minimal = resolveWebhookDispatch(v2, { now: ANTES });
    if (!minimal.ok) throw new Error("v2 mínimo deveria ser válido");
    expect(Object.keys(buildDeliveryEnvelope(minimal.data, "2026-11-22T12:00:00.000Z")).sort()).toEqual(["data", "event", "timestamp"]);
  });
});
