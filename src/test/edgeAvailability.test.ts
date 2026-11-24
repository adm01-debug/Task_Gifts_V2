import { afterEach, describe, expect, it, vi } from "vitest";

const { isFunctionDeployed } = await import("@/lib/edgeAvailability");

afterEach(() => vi.unstubAllEnvs());

describe("isFunctionDeployed — allowlist compilada", () => {
  it("allowlist vazia bloqueia todas as funções (kill switch documentado)", () => {
    vi.stubEnv("VITE_DEPLOYED_EDGE_FUNCTIONS", "");
    expect(isFunctionDeployed("push-public-key")).toBe(false);
    expect(isFunctionDeployed("passkey-auth")).toBe(false);
  });

  it("passkey-auth é reconhecida mesmo quando a env do Vercel não a lista", () => {
    vi.stubEnv("VITE_DEPLOYED_EDGE_FUNCTIONS", "push-public-key,verify-ip");
    expect(isFunctionDeployed("passkey-auth")).toBe(true);
    expect(isFunctionDeployed("verify-ip")).toBe(true);
  });

  it("função fora da lista continua bloqueada", () => {
    vi.stubEnv("VITE_DEPLOYED_EDGE_FUNCTIONS", "push-public-key");
    expect(isFunctionDeployed("ai-coach")).toBe(false);
  });
});