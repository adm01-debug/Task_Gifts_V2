import { afterEach, expect, it, vi } from "vitest";
const sentry = vi.hoisted(() => ({ init: vi.fn() }));
vi.mock("@sentry/react", () => ({ init: sentry.init, browserTracingIntegration: () => ({ name: "tracing" }), replayIntegration: () => ({ name: "replay" }) }));
vi.mock("react-dom/client", () => ({ createRoot: () => ({ render: vi.fn() }) }));
vi.mock("@/App.tsx", () => ({ default: () => null }));
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
it("configuração Sentry 11 mantém coleta restritiva sem corpos ou entradas de IA", async () => {
  vi.stubEnv("VITE_SENTRY_DSN", "https://public@example.test/1");
  await import("@/main");
  expect(sentry.init).toHaveBeenCalledWith(expect.objectContaining({
    dataCollection: expect.objectContaining({ userInfo: false, cookies: false, httpBodies: [], databaseQueryData: false, queues: false, genAI: { inputs: false, outputs: false }, graphQL: { document: false, variables: false } }),
  }));
});
