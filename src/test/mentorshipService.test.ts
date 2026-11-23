import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;
type Result = { data: unknown; error: unknown };

const ok = (data: unknown): Result => ({ data, error: null });

const db = vi.hoisted(() => {
  const state = {
    queue: new Map<string, Result[]>(),
    records: [] as Array<{ table: string; op: string; payload: unknown; filters: Array<[string, unknown]>; methods: string[] }>,
  };

  const enqueue = (table: string, op: string, ...results: Result[]) => {
    const key = `${table}:${op}`;
    state.queue.set(key, [...(state.queue.get(key) ?? []), ...results]);
  };

  const build = (table: string) => {
    const record = { table, op: "select", payload: undefined as unknown, filters: [] as Array<[string, unknown]>, methods: [] as string[] };
    state.records.push(record);

    const settle = async (): Promise<Result> => {
      const pending = state.queue.get(`${table}:${record.op}`) ?? [];
      return pending.shift() ?? { data: null, error: null };
    };

    const builder = {
      select: (..._args: unknown[]) => { record.methods.push("select"); return builder; },
      insert: (payload: unknown) => { record.op = "insert"; record.payload = payload; record.methods.push("insert"); return builder; },
      update: (payload: unknown) => { record.op = "update"; record.payload = payload; record.methods.push("update"); return builder; },
      eq: (column: string, value: unknown) => { record.filters.push([column, value]); record.methods.push("eq"); return builder; },
      neq: (..._args: unknown[]) => { record.methods.push("neq"); return builder; },
      in: (..._args: unknown[]) => { record.methods.push("in"); return builder; },
      ilike: (..._args: unknown[]) => { record.methods.push("ilike"); return builder; },
      order: (..._args: unknown[]) => { record.methods.push("order"); return builder; },
      limit: (..._args: unknown[]) => { record.methods.push("limit"); return builder; },
      or: (..._args: unknown[]) => { record.methods.push("or"); return builder; },
      maybeSingle: async () => { record.methods.push("maybeSingle"); return settle(); },
      single: async () => { record.methods.push("single"); return settle(); },
      then: (resolve: (value: Result) => unknown, reject?: (reason: unknown) => unknown) => settle().then(resolve, reject),
    };

    return builder;
  };

  return {
    enqueue,
    records: state.records,
    reset: () => { state.queue.clear(); state.records.length = 0; },
    from: vi.fn((table: string) => build(table)),
  };
});

const profiles = vi.hoisted(() => ({
  addCoins: vi.fn(async () => ({ id: "x", coins: 1 })),
  addXp: vi.fn(async () => ({ profile: { id: "x" }, leveledUp: false })),
  getPublicByIds: vi.fn(async () => [] as Array<{ id: string; display_name: string | null; avatar_url: string | null }>),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: db.from, rpc: vi.fn(async () => ({ data: null, error: null })) },
}));
vi.mock("@/services/profilesService", () => ({ profilesService: profiles }));

const { mentorshipService } = await import("@/services/mentorshipService");

const pair = {
  id: "pair-1",
  mentor_id: "mentor-1",
  apprentice_id: "apprentice-1",
  status: "active" as const,
  started_at: null,
  completed_at: null,
  total_xp_earned: 0,
  total_missions_completed: 0,
  created_at: "",
  updated_at: "",
};

const mission = (overrides: Row = {}) => ({
  id: "mission-1",
  title: "Superar Desafio",
  description: null,
  icon: "🏆",
  xp_reward: 150,
  coin_reward: 75,
  mission_type: "collaborative",
  difficulty: "hard",
  order_index: 6,
  is_active: true,
  created_at: "",
  ...overrides,
});

const progressRow = (overrides: Row = {}) => ({
  id: "progress-1",
  pair_id: "pair-1",
  mission_id: "mission-1",
  completed_by_mentor: false,
  completed_by_apprentice: false,
  mentor_completed_at: null,
  apprentice_completed_at: null,
  rewards_claimed: false,
  created_at: "",
  updated_at: "",
  ...overrides,
});

const lastRecord = () => db.records[db.records.length - 1];
const filterOf = (record: { filters: Array<[string, unknown]> }, column: string) =>
  record.filters.find(([name]) => name === column)?.[1];

beforeEach(() => {
  db.reset();
  vi.clearAllMocks();
  profiles.getPublicByIds.mockResolvedValue([]);
});

describe("markMyPart", () => {
  it("não concede recompensa duas vezes para a mesma parte", async () => {
    db.enqueue("mentorship_missions", "select", ok(mission()));
    db.enqueue("mentorship_mission_progress", "select", ok(progressRow({ completed_by_mentor: true, mentor_completed_at: "2026-01-01" })));

    const result = await mentorshipService.markMyPart(pair, "mission-1", "mentor");

    expect(result.xpAwarded).toBe(0);
    expect(result.coinsAwarded).toBe(0);
    expect(profiles.addXp).not.toHaveBeenCalled();
    expect(profiles.addCoins).not.toHaveBeenCalled();
  });

  it("usa o valor da missão do banco e não fecha a missão colaborativa com um lado só", async () => {
    db.enqueue("mentorship_missions", "select", ok(mission()));
    db.enqueue("mentorship_mission_progress", "select", ok(null));
    db.enqueue("mentorship_mission_progress", "insert", ok(progressRow({ completed_by_mentor: true, mentor_completed_at: "2026-01-01" })));

    const result = await mentorshipService.markMyPart(pair, "mission-1", "mentor");

    expect(profiles.addXp).toHaveBeenCalledWith("mentor-1", 150, "mentorship_mission_mission-1");
    expect(profiles.addCoins).toHaveBeenCalledWith("mentor-1", 75);
    expect(result.xpAwarded).toBe(150);
    expect(result.missionSettled).toBe(false);
    expect(db.records.some((record) => record.table === "mentorship_pairs")).toBe(false);
  });

  it("liquida a missão e soma os totais da dupla quando todos os lados exigidos concluem", async () => {
    db.enqueue("mentorship_missions", "select", ok(mission()));
    db.enqueue("mentorship_mission_progress", "select", ok(null));
    db.enqueue("mentorship_mission_progress", "insert", ok(progressRow({ completed_by_mentor: true, completed_by_apprentice: true })));
    db.enqueue("mentorship_mission_progress", "update", ok(progressRow({ completed_by_mentor: true, completed_by_apprentice: true, rewards_claimed: true })));
    db.enqueue("mentorship_pairs", "select", ok({ total_xp_earned: 0, total_missions_completed: 0 }));

    const result = await mentorshipService.markMyPart(pair, "mission-1", "mentor");

    expect(result.missionSettled).toBe(true);
    const pairsUpdate = db.records.find((record) => record.table === "mentorship_pairs" && record.op === "update");
    expect(pairsUpdate?.payload).toEqual({ total_xp_earned: 300, total_missions_completed: 1 });
    const settle = db.records.find((record) => record.table === "mentorship_mission_progress" && record.op === "update");
    expect(settle?.payload).toEqual({ rewards_claimed: true });
    expect(settle?.methods).toContain("select");
  });

  it("exige a missão real do banco antes de premiar", async () => {
    db.enqueue("mentorship_missions", "select", ok(null));

    await expect(mentorshipService.markMyPart(pair, "mission-inexistente", "mentor")).rejects.toThrow(
      "Missão não encontrada.",
    );
    expect(profiles.addXp).not.toHaveBeenCalled();
  });
});

describe("respondRequest", () => {
  const request = (overrides: Row = {}) => ({
    id: "request-1",
    requester_id: "requester-1",
    target_id: "responder-1",
    request_type: "find_mentor",
    status: "pending",
    message: null,
    created_at: "",
    responded_at: null,
    ...overrides,
  });

  it("quem pediu um mentor vira mentorado ao ter o pedido aceito", async () => {
    db.enqueue("mentorship_requests", "update", ok(request({ status: "accepted" })));
    db.enqueue("mentorship_pairs", "insert", ok({ ...pair, mentor_id: "responder-1", apprentice_id: "requester-1" }));

    const result = await mentorshipService.respondRequest(request() as never, "responder-1", true);

    const insert = db.records.find((record) => record.table === "mentorship_pairs" && record.op === "insert");
    expect(insert?.payload).toMatchObject({ mentor_id: "responder-1", apprentice_id: "requester-1" });
    expect(result.pair?.apprentice_id).toBe("requester-1");
  });

  it("quem se ofereceu para mentorar vira mentor ao ter o pedido aceito", async () => {
    db.enqueue("mentorship_requests", "update", ok(request({ request_type: "find_apprentice", status: "accepted" })));
    db.enqueue("mentorship_pairs", "insert", ok({ ...pair, mentor_id: "requester-1", apprentice_id: "responder-1" }));

    await mentorshipService.respondRequest(
      request({ request_type: "find_apprentice" }) as never,
      "responder-1",
      true,
    );

    const insert = db.records.find((record) => record.table === "mentorship_pairs" && record.op === "insert");
    expect(insert?.payload).toMatchObject({ mentor_id: "requester-1", apprentice_id: "responder-1" });
  });

  it("recusa resposta de quem não é o destinatário sem tocar no banco", async () => {
    await expect(
      mentorshipService.respondRequest(request({ target_id: "outra-pessoa" }) as never, "responder-1", true),
    ).rejects.toThrow("Esta solicitação não foi direcionada a você.");
    expect(db.records).toHaveLength(0);
  });

  it("recusa criar dupla quando a solicitação não está mais pendente", async () => {
    db.enqueue("mentorship_requests", "update", ok(null));

    await expect(mentorshipService.respondRequest(request() as never, "responder-1", true)).rejects.toThrow(
      "Esta solicitação não está mais pendente.",
    );
    expect(db.records.some((record) => record.table === "mentorship_pairs")).toBe(false);
  });
});

describe("createRequest", () => {
  it("bloqueia solicitação para si mesmo", async () => {
    await expect(
      mentorshipService.createRequest({ requesterId: "user-1", targetId: "user-1", requestType: "find_mentor" }),
    ).rejects.toThrow("Você não pode enviar uma solicitação para si mesmo.");
    expect(db.records).toHaveLength(0);
  });

  it("bloqueia solicitação sem destinatário (RLS só entrega o pedido ao alvo)", async () => {
    await expect(
      mentorshipService.createRequest({ requesterId: "user-1", targetId: "", requestType: "find_mentor" }),
    ).rejects.toThrow("Escolha a pessoa para quem enviar a solicitação.");
    expect(db.records).toHaveLength(0);
  });

  it("reaproveita um pedido pendente existente em vez de duplicar", async () => {
    db.enqueue("mentorship_requests", "select", ok({ id: "request-1", requester_id: "user-1", target_id: "user-2", request_type: "find_mentor", status: "pending", message: null, created_at: "", responded_at: null }));

    const created = await mentorshipService.createRequest({
      requesterId: "user-1",
      targetId: "user-2",
      requestType: "find_mentor",
    });

    expect(created.id).toBe("request-1");
    expect(db.records.some((record) => record.op === "insert")).toBe(false);
  });

  it("grava o destinatário explícito em um pedido novo", async () => {
    db.enqueue("mentorship_requests", "select", ok(null));
    db.enqueue("mentorship_requests", "insert", ok({ id: "request-2", requester_id: "user-1", target_id: "user-2", request_type: "find_apprentice", status: "pending", message: "oi", created_at: "", responded_at: null }));

    await mentorshipService.createRequest({
      requesterId: "user-1",
      targetId: "user-2",
      requestType: "find_apprentice",
      message: "oi",
    });

    const insert = db.records.find((record) => record.op === "insert");
    expect(insert?.payload).toMatchObject({ requester_id: "user-1", target_id: "user-2", request_type: "find_apprentice" });
  });
});

describe("getIncomingRequests", () => {
  it("busca somente pedidos direcionados ao usuário e descarta os próprios", async () => {
    db.enqueue(
      "mentorship_requests",
      "select",
      ok([
        { id: "request-1", requester_id: "user-2", target_id: "user-1", request_type: "find_mentor", status: "pending", message: null, created_at: "", responded_at: null },
        { id: "request-2", requester_id: "user-1", target_id: "user-1", request_type: "find_mentor", status: "pending", message: null, created_at: "", responded_at: null },
      ]),
    );
    profiles.getPublicByIds.mockResolvedValue([{ id: "user-2", display_name: "Pessoa", avatar_url: null }]);

    const incoming = await mentorshipService.getIncomingRequests("user-1");

    expect(incoming).toHaveLength(1);
    expect(incoming[0].id).toBe("request-1");
    expect(incoming[0].requester?.display_name).toBe("Pessoa");
    const record = lastRecord();
    expect(filterOf(record, "target_id")).toBe("user-1");
    expect(record.methods).not.toContain("or");
  });
});