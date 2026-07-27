/**
 * Simulação do backoff exponencial e da política de retry do invokeEdgeSafe.
 */
import { describe, it, expect } from "vitest";
import { backoffDelayMs } from "@/lib/requestId";
import { classifyEdgeError } from "@/lib/edgeErrors";

describe("backoffDelayMs", () => {
  it("cresce exponencialmente e respeita o teto (500 amostras)", () => {
    for (let attempt = 1; attempt <= 10; attempt++) {
      const base = Math.min(300 * 2 ** (attempt - 1), 8000);
      for (let i = 0; i < 50; i++) {
        const delay = backoffDelayMs(attempt);
        expect(delay).toBeGreaterThanOrEqual(base);
        expect(delay).toBeLessThanOrEqual(8000);
      }
    }
  });

  it("normaliza tentativas inválidas para a primeira", () => {
    for (const attempt of [0, -3, Number.NaN, Number.POSITIVE_INFINITY]) {
      const delay = backoffDelayMs(attempt);
      expect(delay).toBeGreaterThanOrEqual(300);
      expect(delay).toBeLessThanOrEqual(8000);
    }
  });
});

describe("política de retry", () => {
  it("só repete falhas transitórias — nunca 429 nem 4xx de cliente", () => {
    const retryableStatuses = [null, 500, 502, 503, 504];
    const nonRetryable = [400, 401, 402, 403, 404, 409, 422, 429];

    for (const status of retryableStatuses) {
      expect(classifyEdgeError(status, null).retryable).toBe(true);
    }
    for (const status of nonRetryable) {
      expect(classifyEdgeError(status, null).retryable).toBe(false);
    }
  });

  it("tempo total de espera com 3 tentativas fica abaixo de 3s", () => {
    const total = backoffDelayMs(1) + backoffDelayMs(2);
    expect(total).toBeLessThan(3000);
  });
});
