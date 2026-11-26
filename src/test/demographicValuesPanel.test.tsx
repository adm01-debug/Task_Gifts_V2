import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * Contrato da aba Respostas:
 * - gestor nao ve o valor de atributo restrito;
 * - linha de atributo que o gestor nao consegue enxergar (desativado) nao some,
 *   mas entra como uso interno: so' aparece com "Incluir uso interno" ligado,
 *   com rotulo de indisponivel e sem valor (fail-closed).
 */

const estado = vi.hoisted(() => ({ valores: [] as unknown[], ehAdmin: false }));

vi.mock("@/hooks/useDemographics", () => ({
  useAllDemographicValues: () => ({
    data: estado.valores,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/useProfiles", () => ({
  useProfilesPublic: () => ({ data: [{ id: "u1", display_name: "Ana Souza" }] }),
}));

import { DemographicValuesPanel } from "@/components/admin/DemographicValuesPanel";

const base = {
  user_id: "u1",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const linha = (id: string, meta: unknown, extra: Record<string, unknown> = {}) => ({
  ...base,
  id,
  attribute_id: `a-${id}`,
  demographic_attributes: meta,
  ...extra,
});

afterEach(() => {
  cleanup();
  estado.valores = [];
  estado.ehAdmin = false;
});

describe("DemographicValuesPanel", () => {
  it("esconde o valor restrito do gestor e mostra o liberado", () => {
    estado.valores = [
      linha("restrito", {
        name: "Salario",
        attribute_type: "number",
        is_visible_in_reports: true,
        is_restricted: true,
      }),
      linha(
        "liberado",
        { name: "Cidade", attribute_type: "text", is_visible_in_reports: true, is_restricted: false },
        { value: "Recife" },
      ),
    ];

    render(<DemographicValuesPanel ehAdmin={false} />);

    expect(screen.getByText("Cidade")).toBeInTheDocument();
    expect(screen.getByText("Recife")).toBeInTheDocument();
    expect(screen.getByText("Salario")).toBeInTheDocument();
    expect(screen.getByText("Restrito a administradores")).toBeInTheDocument();
  });

  it("mostra o valor restrito para o administrador", () => {
    estado.ehAdmin = true;
    estado.valores = [
      linha(
        "restrito",
        {
          name: "Salario",
          attribute_type: "number",
          is_visible_in_reports: true,
          is_restricted: true,
        },
        { number_value: 5000 },
      ),
    ];

    render(<DemographicValuesPanel ehAdmin />);

    expect(screen.queryByText("Restrito a administradores")).not.toBeInTheDocument();
    expect(screen.getByText(/5000/)).toBeInTheDocument();
  });

  it("trata a resposta sem metadado como uso interno e a mantem na lista", async () => {
    estado.valores = [linha("desativado", null)];

    render(<DemographicValuesPanel ehAdmin={false} />);

    // Fechada por padrao: nem a linha nem a contagem aparecem.
    expect(screen.queryByText("Atributo indisponível")).not.toBeInTheDocument();
    expect(screen.getByText("Nenhuma resposta registrada")).toBeInTheDocument();
    // O resumo separa o que esta' visivel do que ficou oculto.
    const resumo = screen.getByText((_, el) => {
      const texto = el?.textContent ?? "";
      return (
        el?.tagName === "P" &&
        texto.includes("0 resposta(s) de 0 colaborador(es).") &&
        texto.includes("1 de uso interno oculta(s).")
      );
    });
    expect(resumo).toBeInTheDocument();

    fireEvent.click(screen.getByRole("switch", { name: /Incluir atributos de uso interno/i }));

    await waitFor(() => expect(screen.getByText("Atributo indisponível")).toBeInTheDocument());
    expect(screen.getByText("Restrito a administradores")).toBeInTheDocument();
    expect(screen.getByText("Ana Souza")).toBeInTheDocument();
  });
});