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
      select: () => builder,
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

const { savedFiltersService } = await import("@/services/savedFiltersService");

const filtro = (overrides: Row = {}) => ({
  id: "f1",
  user_id: "user-1",
  entity_type: "audit_logs",
  name: "Falhas de login",
  filters: { selectedAction: "login_failed" },
  is_default: false,
  created_at: "",
  updated_at: "",
  ...overrides,
});

beforeEach(() => {
  db.records.length = 0;
  db.state.user = { id: "user-1" };
});

describe("savedFiltersService", () => {
  it("salva usando o usuario da sessao e conflito unico por usuario+entidade+nome", async () => {
    db.enqueue("saved_filters", "upsert", ok(filtro()));

    const salvo = await savedFiltersService.save({
      entityType: "audit_logs",
      name: "Falhas de login",
      filters: { selectedAction: "login_failed" },
    });

    expect(salvo.id).toBe("f1");
    const [registro] = db.records;
    expect(registro.op).toBe("upsert");
    expect(registro.onConflict).toBe("user_id,entity_type,name");
    expect(registro.payload).toMatchObject({
      user_id: "user-1",
      entity_type: "audit_logs",
      name: "Falhas de login",
      is_default: false,
    });
  });

  it("recusa salvar sem sessao", async () => {
    db.state.user = null;

    await expect(
      savedFiltersService.save({ entityType: "audit_logs", name: "x", filters: {} }),
    ).rejects.toThrow("Sem usuario autenticado");
    expect(db.records).toHaveLength(0);
  });

  it("ao tornar padrao, desmarca o padrao anterior da mesma entidade antes de marcar o novo", async () => {
    await savedFiltersService.setDefault("f2", "audit_logs");

    expect(db.records).toHaveLength(2);

    const [limpeza, marcacao] = db.records;
    expect(limpeza.op).toBe("update");
    expect(limpeza.payload).toEqual({ is_default: false });
    expect(limpeza.filters).toEqual([
      ["entity_type", "audit_logs"],
      ["is_default", true],
    ]);

    expect(marcacao.op).toBe("update");
    expect(marcacao.payload).toEqual({ is_default: true });
    expect(marcacao.filters).toEqual([["id", "f2"]]);
  });

  it("lista apenas os filtros da entidade informada", async () => {
    db.enqueue("saved_filters", "select", ok([filtro()]));

    const lista = await savedFiltersService.list("audit_logs");

    expect(lista).toHaveLength(1);
    expect(db.records[0].filters).toEqual([["entity_type", "audit_logs"]]);
  });

  it("propaga o erro do banco em vez de engolir", async () => {
    db.enqueue("saved_filters", "delete", {
      data: null,
      error: { message: "permission denied" },
    });

    await expect(savedFiltersService.remove("f1")).rejects.toEqual({ message: "permission denied" });
  });
});