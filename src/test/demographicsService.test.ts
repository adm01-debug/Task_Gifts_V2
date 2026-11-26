import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;
type Result = { data: unknown; error: unknown };

const ok = (data: unknown): Result => ({ data, error: null });

const db = vi.hoisted(() => {
  const state = {
    queue: new Map<string, Result[]>(),
    records: [] as Array<{
      table: string;
      op: string;
      payload: unknown;
      onConflict?: string;
      columns?: string;
      filters: Array<[string, unknown]>;
    }>,
    user: { id: "user-1" } as { id: string } | null,
  };

  const enqueue = (table: string, op: string, ...results: Result[]) => {
    const key = `${table}:${op}`;
    state.queue.set(key, [...(state.queue.get(key) ?? []), ...results]);
  };

  const build = (table: string) => {
    const record: (typeof state.records)[number] = {
      table,
      op: "select",
      payload: undefined,
      filters: [],
    };
    state.records.push(record);

    const settle = async (): Promise<Result> => {
      const pending = state.queue.get(`${table}:${record.op}`) ?? [];
      return pending.shift() ?? { data: null, error: null };
    };

    const builder = {
      select: (columns?: string) => { record.columns = columns ?? "*"; return builder; },
      insert: (payload: unknown) => { record.op = "insert"; record.payload = payload; return builder; },
      update: (payload: unknown) => { record.op = "update"; record.payload = payload; return builder; },
      delete: () => { record.op = "delete"; return builder; },
      upsert: (payload: unknown, options?: { onConflict?: string }) => {
        record.op = "upsert";
        record.payload = payload;
        record.onConflict = options?.onConflict;
        return builder;
      },
      eq: (column: string, value: unknown) => { record.filters.push([column, value]); return builder; },
      order: () => builder,
      single: async () => settle(),
      maybeSingle: async () => settle(),
      then: (resolve: (value: Result) => unknown, reject?: (reason: unknown) => unknown) =>
        settle().then(resolve, reject),
    };

    return builder;
  };

  return {
    enqueue,
    records: state.records,
    state,
    from: vi.fn((table: string) => build(table)),
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: db.from,
    auth: { getUser: vi.fn(async () => ({ data: { user: db.state.user } })) },
  },
}));

const {
  demographicsService,
  ehPreferNotAnswer,
  ehTipoComOpcoes,
  lerOpcoes,
  rotuloTipo,
  valorExibivel,
  PREFER_NOT_ANSWER,
} = await import("@/services/demographicsService");

const valor = (overrides: Row = {}) => ({
  id: "v1",
  user_id: "user-1",
  attribute_id: "a1",
  value: null,
  values_array: [],
  number_value: null,
  date_value: null,
  created_at: "",
  updated_at: "",
  ...overrides,
});

beforeEach(() => {
  db.records.length = 0;
  db.state.user = { id: "user-1" };
});

describe("helpers de atributo demografico", () => {
  it("le opcoes em lista de strings e no formato {value,label} do Studio", () => {
    expect(lerOpcoes(["Solteiro", "Casado"])).toEqual(["Solteiro", "Casado"]);
    expect(lerOpcoes([{ value: "sp", label: "Sao Paulo" }, { value: "rj" }])).toEqual(["sp", "rj"]);
    expect(lerOpcoes([])).toEqual([]);
    expect(lerOpcoes(null)).toEqual([]);
    expect(lerOpcoes({ value: "sp" })).toEqual([]);
    expect(lerOpcoes([42, null, { label: "sem valor" }])).toEqual([]);
  });

  it("reconhece a marca de preferir nao responder", () => {
    expect(ehPreferNotAnswer([PREFER_NOT_ANSWER])).toBe(true);
    expect(ehPreferNotAnswer(["Solteiro"])).toBe(false);
    expect(ehPreferNotAnswer(null)).toBe(false);
    expect(ehPreferNotAnswer(PREFER_NOT_ANSWER)).toBe(false);
  });

  it("so tipos de selecao usam a lista de opcoes", () => {
    expect(ehTipoComOpcoes("single_select")).toBe(true);
    expect(ehTipoComOpcoes("multi_select")).toBe(true);
    expect(ehTipoComOpcoes("text")).toBe(false);
    expect(ehTipoComOpcoes("calculated")).toBe(false);
  });

  it("traduz o tipo e cai no valor cru quando desconhecido", () => {
    expect(rotuloTipo("text")).toBe("Texto livre");
    expect(rotuloTipo("inventado")).toBe("inventado");
  });

  it("monta o texto exibivel conforme o tipo preenchido", () => {
    expect(valorExibivel(valor({ value: "Ana" }) as never)).toBe("Ana");
    expect(valorExibivel(valor({ values_array: ["sp", "rj"] }) as never)).toBe("sp, rj");
    expect(valorExibivel(valor({ number_value: 3 }) as never)).toBe("3");
    expect(valorExibivel(valor({ date_value: "1990-05-09" }) as never)).toBe("09/05/1990");
    expect(valorExibivel(valor({ values_array: [PREFER_NOT_ANSWER] }) as never)).toBe(
      "Prefiro não responder",
    );
    expect(valorExibivel(valor() as never)).toBe("Não informado");
  });
});

describe("demographicsService", () => {
  it("filtra apenas atributos ativos quando pedido", async () => {
    db.enqueue("demographic_attributes", "select", ok([]));

    await demographicsService.listAttributes({ onlyActive: true });

    expect(db.records[0].filters).toEqual([["is_active", true]]);
  });

  it("grava a resposta do usuario da sessao com conflito por usuario+atributo", async () => {
    db.enqueue("user_demographic_values", "upsert", ok(valor({ number_value: 42 })));

    const salvo = await demographicsService.saveValue({ attributeId: "a1", numberValue: 42 });

    expect(salvo.number_value).toBe(42);
    const [registro] = db.records;
    expect(registro.onConflict).toBe("user_id,attribute_id");
    expect(registro.payload).toEqual({
      user_id: "user-1",
      attribute_id: "a1",
      value: null,
      values_array: [],
      number_value: 42,
      date_value: null,
    });
  });

  it("preferir nao responder grava a marca sem apagar a linha", async () => {
    db.enqueue("user_demographic_values", "upsert", ok(valor({ values_array: [PREFER_NOT_ANSWER] })));

    await demographicsService.setPreferNotAnswer("a1");

    expect(db.records[0].op).toBe("upsert");
    expect(db.records[0].payload).toMatchObject({
      values_array: [PREFER_NOT_ANSWER],
      value: null,
      number_value: null,
      date_value: null,
    });
  });

  it("recusa gravar resposta sem sessao", async () => {
    db.state.user = null;

    await expect(
      demographicsService.saveValue({ attributeId: "a1", value: "Ana" }),
    ).rejects.toThrow("Sem usuário autenticado");
    expect(db.records).toHaveLength(0);
  });

  it("excluir atributo apaga pelo id e propaga erro do banco", async () => {
    db.enqueue("demographic_attributes", "delete", {
      data: null,
      error: { message: "foreign key" },
    });

    await expect(demographicsService.deleteAttribute("a1")).rejects.toEqual({
      message: "foreign key",
    });
    expect(db.records[0].filters).toEqual([["id", "a1"]]);
  });

  it("le as respostas do proprio usuario, nunca as de terceiros", async () => {
    db.enqueue("user_demographic_values", "select", ok([valor()]));

    await demographicsService.listMyValues();

    expect(db.records[0].filters).toEqual([["user_id", "user-1"]]);
  });

  it("sem sessao nao consulta o proprio perfil", async () => {
    db.state.user = null;

    await expect(demographicsService.listMyValues()).resolves.toEqual([]);
    expect(db.records).toHaveLength(0);
  });

  it("le o painel pela view, em uma consulta so', sem filtro por papel", async () => {
    db.enqueue("demographic_values_panel", "select", ok([]));

    await demographicsService.listAllValues();

    expect(db.records).toHaveLength(1);
    expect(db.records[0].table).toBe("demographic_values_panel");
    expect(db.records[0].filters).toEqual([]);
  });

  it("entrega o valor que a view liberou para o administrador", async () => {
    db.enqueue(
      "demographic_values_panel",
      "select",
      ok([
        {
          id: "v1",
          user_id: "user-1",
          attribute_id: "a1",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
          value: "Resposta aberta",
          values_array: null,
          number_value: null,
          date_value: null,
          attribute_name: "Cidade",
          attribute_type: "text",
          attribute_is_visible_in_reports: true,
          attribute_is_restricted: false,
        },
      ]),
    );

    const [linha] = await demographicsService.listAllValues();

    expect(linha.value).toBe("Resposta aberta");
    expect(linha.demographic_attributes).toEqual({
      name: "Cidade",
      attribute_type: "text",
      is_visible_in_reports: true,
      is_restricted: false,
    });
  });

  it("linha mascarada pela view chega sem valor e sem metadado sem virar erro", async () => {
    db.enqueue(
      "demographic_values_panel",
      "select",
      ok([
        {
          id: "v-restrito",
          user_id: "user-1",
          attribute_id: "a-restrito",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
          value: null,
          values_array: null,
          number_value: null,
          date_value: null,
          attribute_name: "Salario",
          attribute_type: "number",
          attribute_is_visible_in_reports: true,
          attribute_is_restricted: true,
        },
        {
          id: "v-desativado",
          user_id: "user-1",
          attribute_id: "a-desativado",
          created_at: "2026-01-02T00:00:00Z",
          updated_at: "2026-01-02T00:00:00Z",
          value: null,
          values_array: null,
          number_value: null,
          date_value: null,
          attribute_name: null,
          attribute_type: null,
          attribute_is_visible_in_reports: null,
          attribute_is_restricted: null,
        },
      ]),
    );

    const linhas = await demographicsService.listAllValues();
    const porId = new Map(linhas.map((l) => [l.id, l]));

    // Valor restrito: a view devolve null, a linha continua na lista e o
    // metadado diz que e' restrito — a tela usa isso para esconder.
    expect(porId.get("v-restrito")?.value).toBeNull();
    expect(porId.get("v-restrito")?.demographic_attributes?.is_restricted).toBe(true);
    // Atributo desativado: sem metadado nenhum, o que a tela trata como
    // restrito e de uso interno.
    expect(porId.get("v-desativado")?.demographic_attributes).toBeNull();
  });

  it("erro da view sobe para a tela", async () => {
    db.enqueue("demographic_values_panel", "select", {
      data: null,
      error: { message: "permission denied" },
    });

    await expect(demographicsService.listAllValues()).rejects.toEqual({
      message: "permission denied",
    });
  });
});