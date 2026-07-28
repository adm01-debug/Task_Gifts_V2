import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

/**
 * Testa o contrato critico do hook de preferencias:
 *  - carga inicial aplica defaults quando o banco esta vazio;
 *  - escrita e ADITIVA (nao apaga tipos de outros modulos);
 *  - falha na leitura previa ABORTA a escrita (sem gravar sobre desconhecido);
 *  - falha no upsert faz ROLLBACK deterministico da UI.
 */

let stored: Record<string, unknown> = {};
let readError: unknown = null;
let writeError: unknown = null;
const upserts: Array<Record<string, unknown>> = [];

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u1" } }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/services/loggingService", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () =>
            readError
              ? { data: null, error: readError }
              : { data: { type_preferences: stored }, error: null },
        }),
      }),
      upsert: async (row: { type_preferences: Record<string, unknown> }) => {
        if (writeError) return { error: writeError };
        upserts.push(row.type_preferences);
        stored = row.type_preferences;
        return { error: null };
      },
    }),
  },
}));

import { useTypePreferences } from "@/hooks/useTypePreferences";

const defaults = () => ({ in_app: true, push: true, email: false });
const opts = {
  types: ["campaign_enrolled", "campaign_progress"] as const,
  defaultsFor: defaults,
  moduleName: "teste",
};

async function setup() {
  const hook = renderHook(() => useTypePreferences({ ...opts, types: [...opts.types] }));
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

describe("useTypePreferences", () => {
  beforeEach(() => {
    stored = {};
    readError = null;
    writeError = null;
    upserts.length = 0;
  });

  it("aplica defaults quando o banco esta vazio", async () => {
    const { result } = await setup();
    expect(result.current.values.campaign_enrolled).toEqual(defaults());
  });

  it("hidrata valores existentes do banco", async () => {
    stored = { campaign_progress: { channels: { in_app: false, push: false, email: true } } };
    const { result } = await setup();
    expect(result.current.values.campaign_progress.push).toBe(false);
    expect(result.current.values.campaign_progress.email).toBe(true);
  });

  it("escreve de forma aditiva, preservando tipos de outros modulos", async () => {
    stored = { card_pack: { channels: { in_app: true, push: true, email: false } } };
    const { result } = await setup();
    await act(async () => {
      await result.current.setCell("campaign_enrolled", "push", false);
    });
    const written = upserts.at(-1)!;
    expect(written.card_pack).toBeDefined();
    expect((written.campaign_enrolled as any).channels.push).toBe(false);
  });

  it("aborta a escrita quando a leitura previa falha", async () => {
    const { result } = await setup();
    readError = { message: "boom" };
    await act(async () => {
      await result.current.setCell("campaign_enrolled", "push", false);
    });
    expect(upserts).toHaveLength(0);
    expect(result.current.values.campaign_enrolled.push).toBe(true); // rollback
  });

  it("faz rollback deterministico quando o upsert falha", async () => {
    const { result } = await setup();
    writeError = { message: "denied" };
    await act(async () => {
      await result.current.setCell("campaign_progress", "email", true);
    });
    expect(result.current.values.campaign_progress.email).toBe(false);
    expect(result.current.saving).toBeNull();
  });

  it("aplica canal em lote para todos os tipos e faz rollback total em falha", async () => {
    const { result } = await setup();
    await act(async () => {
      await result.current.setChannelForAll("push", false);
    });
    expect(result.current.values.campaign_enrolled.push).toBe(false);
    expect(result.current.values.campaign_progress.push).toBe(false);

    writeError = { message: "denied" };
    await act(async () => {
      await result.current.setChannelForAll("push", true);
    });
    expect(result.current.values.campaign_enrolled.push).toBe(false);
    expect(result.current.values.campaign_progress.push).toBe(false);
  });
});
