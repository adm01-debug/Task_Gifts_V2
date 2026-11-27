import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

/**
 * Contrato do cache do painel de respostas: a chave da consulta carrega o
 * usuario logado, entao trocar de conta na mesma aba nao reaproveita o cache de
 * quem estava antes (que pode ter sido um admin, com respostas que o novo papel
 * nao pode ver).
 */

const estado = { user: { id: "admin-1" } as { id: string } | null };

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: estado.user }) }));

const respostas = [
  { id: "v1", user_id: "user-1", attribute_id: "a1", value: "9000" },
  { id: "v2", user_id: "user-1", attribute_id: "a2", value: null },
];
let chamada = 0;
const listAllValues = vi.fn(async () => [respostas[chamada++ % respostas.length]]);

vi.mock("@/services/demographicsService", () => ({
  demographicsService: { listAllValues: () => listAllValues() },
}));

import { demographicKeys, useAllDemographicValues } from "@/hooks/useDemographics";

const criarClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

function wrapperDe(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe("useAllDemographicValues", () => {
  beforeEach(() => {
    estado.user = { id: "admin-1" };
    chamada = 0;
    listAllValues.mockClear();
  });

  it("guarda o resultado na chave do usuario logado", async () => {
    const client = criarClient();
    const hook = renderHook(() => useAllDemographicValues(), {
      wrapper: wrapperDe(client),
    });

    await waitFor(() => expect(hook.result.current.data?.[0]?.value).toBe("9000"));

    expect(listAllValues).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(demographicKeys.allValues("admin-1"))).toBeDefined();
    expect(client.getQueryData(demographicKeys.allValues("gestor-2"))).toBeUndefined();
  });

  it("nao reaproveita o cache do admin quando outra conta entra", async () => {
    const client = criarClient();
    const hook = renderHook(() => useAllDemographicValues(), {
      wrapper: wrapperDe(client),
    });
    await waitFor(() => expect(hook.result.current.data?.[0]?.value).toBe("9000"));

    estado.user = { id: "gestor-2" };
    hook.rerender();

    // Consulta nova para a conta nova: o dado do gestor (valor mascarado pelo
    // banco) substitui o do admin na tela.
    await waitFor(() => expect(listAllValues).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(hook.result.current.data?.[0]?.value).toBeNull());

    // E o cache do admin continua sendo o do admin.
    const doAdmin = client.getQueryData<Array<{ value: string | null }>>(
      demographicKeys.allValues("admin-1"),
    );
    expect(doAdmin?.[0]?.value).toBe("9000");
  });

  it("sem sessao nao consulta o painel", async () => {
    estado.user = null;
    const client = criarClient();
    const hook = renderHook(() => useAllDemographicValues(), {
      wrapper: wrapperDe(client),
    });

    expect(hook.result.current.data).toBeUndefined();
    expect(listAllValues).not.toHaveBeenCalled();
  });
});