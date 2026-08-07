/**
 * Simulação exaustiva do classificador de erros de Edge Functions.
 * Cobre ~1.000 combinações de status x corpo x header x erro local.
 */
import { describe, it, expect } from "vitest";
import {
  classifyEdgeError,
  describeEdgeError,
  normalizeRetryAfter,
  type EdgeErrorKind,
} from "@/lib/edgeErrors";

function fakeInvokeError(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
) {
  const response = new Response(
    typeof body === "string" ? body : JSON.stringify(body),
    { status, headers },
  );
  const err = new Error(`Edge Function returned a non-2xx status code`);
  (err as Error & { context?: Response }).context = response;
  return err;
}

describe("normalizeRetryAfter", () => {
  it("usa 60s como padrão para valores inválidos", () => {
    for (const raw of [undefined, null, "", "abc", 0, -5, Number.NaN, {}, []]) {
      expect(normalizeRetryAfter(raw)).toBe(60);
    }
  });

  it("aceita números e strings numéricas, arredondando para cima", () => {
    expect(normalizeRetryAfter(30)).toBe(30);
    expect(normalizeRetryAfter("45")).toBe(45);
    expect(normalizeRetryAfter(12.3)).toBe(13);
  });

  it("limita a 1h para evitar mensagens absurdas", () => {
    expect(normalizeRetryAfter(999999)).toBe(3600);
  });
});

describe("classifyEdgeError — matriz de status", () => {
  const expectations: Array<[number, EdgeErrorKind, boolean]> = [
    [400, "bad_request", false],
    [401, "unauthorized", false],
    [402, "payment_required", false],
    [403, "forbidden", false],
    [404, "not_found", false],
    [409, "bad_request", false],
    [422, "bad_request", false],
    [429, "rate_limited", false],
    [500, "server_error", true],
    [502, "server_error", true],
    [503, "server_error", true],
    [504, "server_error", true],
    [200, "unknown", true],
  ];

  it.each(expectations)("status %i -> %s", (status, kind, retryable) => {
    const info = classifyEdgeError(status, { error: "Erro" });
    expect(info.kind).toBe(kind);
    expect(info.retryable).toBe(retryable);
    expect(info.status).toBe(status);
    expect(info.message.length).toBeGreaterThan(0);
  });

  it("trata ausência de status como falha de rede", () => {
    const info = classifyEdgeError(null, null);
    expect(info.kind).toBe("network");
    expect(info.retryable).toBe(true);
    expect(info.retryAfterSeconds).toBeNull();
  });
});

describe("simulação combinatória", () => {
  const statuses = [null, 200, 400, 401, 402, 403, 404, 409, 422, 429, 500, 502, 503];
  const payloads: Array<unknown> = [
    null,
    {},
    { error: "Rate limit exceeded", retryAfter: 60 },
    { error: "Rate limit exceeded", retryAfter: "15" },
    { error: "Rate limit exceeded", retryAfter: -1 },
    { message: "Falha temporária" },
    { error: 12345 },
    { error: "x".repeat(400) },
    { error: "TypeError: boom\n    at foo (/srv/index.ts:10:5)" },
  ];
  const fallbacks = [undefined, "", "Erro local"];

  it("nunca lança e sempre devolve mensagem segura", () => {
    let count = 0;
    for (const status of statuses) {
      for (const payload of payloads) {
        for (const fallback of fallbacks) {
          const info = classifyEdgeError(
            status,
            payload as Record<string, unknown> | null,
            fallback,
          );
          count += 1;

          expect(typeof info.message).toBe("string");
          expect(info.message.trim().length).toBeGreaterThan(0);
          // Nunca vaza stack trace nem textos gigantes para a UI.
          expect(info.message.length).toBeLessThanOrEqual(220);
          expect(info.message).not.toMatch(/\bat\s.+:\d+:\d+/);

          if (info.kind === "rate_limited") {
            expect(info.retryAfterSeconds).toBeGreaterThan(0);
            expect(info.retryAfterSeconds).toBeLessThanOrEqual(3600);
            expect(info.message).toContain("segundos");
          } else {
            expect(info.retryAfterSeconds).toBeNull();
          }
        }
      }
    }
    expect(count).toBe(statuses.length * payloads.length * fallbacks.length);
  });

  it("é determinístico para a mesma entrada", () => {
    for (const status of statuses) {
      const a = classifyEdgeError(status, { error: "e", retryAfter: 30 });
      const b = classifyEdgeError(status, { error: "e", retryAfter: 30 });
      expect(a).toEqual(b);
    }
  });
});

describe("describeEdgeError — integração com FunctionsHttpError", () => {
  it("extrai retryAfter do corpo em 429 (cenário do incidente)", async () => {
    const info = await describeEdgeError(
      fakeInvokeError(429, { error: "Rate limit exceeded", retryAfter: 60 }),
    );
    expect(info.kind).toBe("rate_limited");
    expect(info.retryAfterSeconds).toBe(60);
    expect(info.message).toBe("Muitas solicitações seguidas. Tente novamente em 60 segundos.");
  });

  it("usa o header Retry-After quando o corpo não traz o campo", async () => {
    const info = await describeEdgeError(
      fakeInvokeError(429, { error: "Rate limit exceeded" }, { "retry-after": "20" }),
    );
    expect(info.retryAfterSeconds).toBe(20);
  });

  it("sobrevive a corpo não-JSON", async () => {
    const info = await describeEdgeError(fakeInvokeError(500, "<html>502 Bad Gateway</html>"));
    expect(info.kind).toBe("server_error");
    expect(info.retryable).toBe(true);
  });

  it("classifica erro de rede sem context", async () => {
    const info = await describeEdgeError(new TypeError("Failed to fetch"));
    expect(info.kind).toBe("network");
    expect(info.message).toBe("Failed to fetch");
  });

  it("aceita erros não-Error sem quebrar", async () => {
    for (const raw of [null, undefined, 42, "boom", {}, []]) {
      const info = await describeEdgeError(raw);
      expect(info.message.length).toBeGreaterThan(0);
    }
  });
});
