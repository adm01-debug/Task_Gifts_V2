import { beforeEach, describe, expect, it, vi } from "vitest";

type Result = { data: unknown; error: unknown };

const ok = (data: unknown): Result => ({ data, error: null });

const rpc = vi.hoisted(() => vi.fn(async (..._args: unknown[]): Promise<Result> => ok(null)));

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
      delete: () => { record.op = "delete"; record.methods.push("delete"); return builder; },
      eq: (column: string, value: unknown) => { record.filters.push([column, value]); record.methods.push("eq"); return builder; },
      is: (column: string, value: unknown) => { record.filters.push([`is:${column}`, value]); record.methods.push("is"); return builder; },
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

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: db.from, rpc },
}));
vi.mock("@/services/loggingService", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));
vi.mock("@/services/engagementDiagnosticsService", () => ({ MIN_RESPONDENTS: 5 }));

const { climateSurveyService } = await import("@/services/climateSurveyService");

describe("climateSurveyService", () => {
  beforeEach(() => {
    db.reset();
    rpc.mockReset();
    rpc.mockResolvedValue(ok(null));
  });

  describe("submitResponse", () => {
    it("envia as respostas pela RPC com score e texto normalizados", async () => {
      await climateSurveyService.submitResponse("survey-1", [
        { questionId: "q1", score: 4 },
        { questionId: "q2", textAnswer: "bom ambiente" },
      ]);

      expect(rpc).toHaveBeenCalledTimes(1);
      const [fn, args] = rpc.mock.calls[0] as [string, { p_survey_id: string; p_answers: unknown[] }];
      expect(fn).toBe("climate_submit_response");
      expect(args.p_survey_id).toBe("survey-1");
      expect(args.p_answers).toEqual([
        { question_id: "q1", score: 4, text_answer: null },
        { question_id: "q2", score: null, text_answer: "bom ambiente" },
      ]);
    });

    it("traduz a violação de unicidade (23505) em mensagem clara", async () => {
      rpc.mockResolvedValue({ data: null, error: { code: "23505", message: "duplicate key value" } });

      await expect(climateSurveyService.submitResponse("survey-1", [{ questionId: "q1", score: 3 }]))
        .rejects.toThrow("Você já respondeu esta pesquisa.");
    });

    it("propaga outros erros sem mascarar", async () => {
      const error = { code: "42501", message: "sem permissão" };
      rpc.mockResolvedValue({ data: null, error });

      await expect(climateSurveyService.submitResponse("survey-1", [{ questionId: "q1", score: 3 }]))
        .rejects.toBe(error);
    });
  });

  describe("getMyAnsweredSurveyIds", () => {
    it("filtra pelas respostas do usuário e devolve só os ids das pesquisas", async () => {
      db.enqueue("climate_survey_responses", "select", ok([{ survey_id: "a" }, { survey_id: "b" }]));

      await expect(climateSurveyService.getMyAnsweredSurveyIds("user-1")).resolves.toEqual(["a", "b"]);

      const record = db.records[db.records.length - 1];
      expect(record.table).toBe("climate_survey_responses");
      expect(record.filters).toEqual([["user_id", "user-1"]]);
    });

    it("devolve lista vazia quando o usuário ainda não respondeu nada", async () => {
      db.enqueue("climate_survey_responses", "select", ok(null));
      await expect(climateSurveyService.getMyAnsweredSurveyIds("user-1")).resolves.toEqual([]);
    });
  });

  describe("recalculatePillarScores", () => {
    it("usa o limite de anonimato padrão e devolve quantos pilares foram recalculados", async () => {
      rpc.mockResolvedValue(ok(3));

      await expect(climateSurveyService.recalculatePillarScores("survey-1")).resolves.toBe(3);
      expect(rpc).toHaveBeenCalledWith("climate_recalculate_pillar_scores", {
        p_survey_id: "survey-1",
        p_min_responses: 5,
      });
    });

    it("devolve 0 quando a RPC responde nulo", async () => {
      rpc.mockResolvedValue(ok(null));
      await expect(climateSurveyService.recalculatePillarScores("survey-1", 2)).resolves.toBe(0);
    });
  });

  describe("calculateENPS", () => {
    it("lê o eNPS da RPC e devolve o payload completo", async () => {
      const payload = {
        enps: 42,
        promoters: 6,
        passives: 2,
        detractors: 1,
        total: 9,
        response_count: 9,
        suppressed: false,
        min_responses: 5,
      };
      rpc.mockResolvedValue(ok(payload));

      await expect(climateSurveyService.calculateENPS("survey-1")).resolves.toEqual(payload);
    });

    it("propaga erro da RPC em vez de devolver eNPS falso", async () => {
      rpc.mockResolvedValue({ data: null, error: { code: "42883", message: "function does not exist" } });

      await expect(climateSurveyService.calculateENPS("survey-1")).rejects.toMatchObject({ code: "42883" });
    });
  });

  describe("deleteQuestion", () => {
    it("remove a pergunta pelo id", async () => {
      await climateSurveyService.deleteQuestion("q1");

      const record = db.records[db.records.length - 1];
      expect(record.table).toBe("climate_survey_questions");
      expect(record.op).toBe("delete");
      expect(record.filters).toEqual([["id", "q1"]]);
    });

    it("propaga erro de RLS ao remover pergunta de pesquisa alheia", async () => {
      db.enqueue("climate_survey_questions", "delete", { data: null, error: { code: "42501", message: "denied" } });

      await expect(climateSurveyService.deleteQuestion("q1")).rejects.toMatchObject({ code: "42501" });
    });
  });

  describe("getPillarScores", () => {
    it("busca os scores consolidados (department_id nulo) por padrão", async () => {
      db.enqueue("climate_pillar_scores", "select", ok([
        { id: "s1", survey_id: "survey-1", pillar: "peers", score: 72.5, response_count: 8, department_id: null },
      ]));

      const scores = await climateSurveyService.getPillarScores("survey-1");
      expect(scores).toHaveLength(1);
      expect(scores[0].score).toBe(72.5);

      const record = db.records[db.records.length - 1];
      expect(record.filters).toEqual([["survey_id", "survey-1"], ["is:department_id", null]]);
    });

    it("filtra por departamento quando informado", async () => {
      db.enqueue("climate_pillar_scores", "select", ok([]));

      await climateSurveyService.getPillarScores("survey-1", "dep-1");

      const record = db.records[db.records.length - 1];
      expect(record.filters).toEqual([["survey_id", "survey-1"], ["department_id", "dep-1"]]);
    });
  });
});
