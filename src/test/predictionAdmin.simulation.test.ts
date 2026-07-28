import { describe, expect, it } from "vitest";
import {
  canPerform,
  describeAction,
  hasBlockingIssues,
  normalizeDraft,
  summarizeMarkets,
  validatePredictionDraft,
  type PredictionAdminAction,
  type PredictionAdminStatus,
  type PredictionDraft,
  type PredictionStateView,
} from "@/lib/predictionAdmin";

function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0xffffffff;
  };
}

const NOW = Date.UTC(2026, 0, 1);
const HOUR = 3_600_000;

function baseDraft(): PredictionDraft {
  return {
    title: "Bateremos a meta do trimestre?",
    description: "Vale para o fechamento oficial.",
    options: ["Sim", "Não"],
    minStake: 10,
    maxStakePerUser: 500,
    rakeBps: 500,
    locksAt: new Date(NOW + 24 * HOUR).toISOString(),
    resolvesAt: new Date(NOW + 48 * HOUR).toISOString(),
  };
}

describe("predictionAdmin — validação de rascunho", () => {
  it("aceita um rascunho saudável", () => {
    expect(validatePredictionDraft(baseDraft(), NOW)).toEqual([]);
  });

  it("rejeita pergunta curta, longa e descrição excessiva", () => {
    expect(hasBlockingIssues(validatePredictionDraft({ ...baseDraft(), title: "Oi" }, NOW))).toBe(true);
    expect(hasBlockingIssues(validatePredictionDraft({ ...baseDraft(), title: "x".repeat(141) }, NOW))).toBe(true);
    expect(hasBlockingIssues(validatePredictionDraft({ ...baseDraft(), description: "y".repeat(801) }, NOW))).toBe(true);
  });

  it("rejeita opções insuficientes, duplicadas, excessivas ou longas", () => {
    const cases: string[][] = [
      ["Sim"],
      ["Sim", "sim"],
      ["a", "b", "c", "d", "e", "f", "g"],
      ["Sim", "z".repeat(61)],
    ];
    for (const options of cases) {
      expect(hasBlockingIssues(validatePredictionDraft({ ...baseDraft(), options }, NOW))).toBe(true);
    }
    // Espaços em branco não contam como opção.
    expect(hasBlockingIssues(validatePredictionDraft({ ...baseDraft(), options: ["Sim", "   "] }, NOW))).toBe(true);
  });

  it("valida economia: aporte mínimo, teto e rake", () => {
    expect(hasBlockingIssues(validatePredictionDraft({ ...baseDraft(), minStake: 0 }, NOW))).toBe(true);
    expect(hasBlockingIssues(validatePredictionDraft({ ...baseDraft(), minStake: 1.5 }, NOW))).toBe(true);
    expect(hasBlockingIssues(validatePredictionDraft({ ...baseDraft(), maxStakePerUser: -1 }, NOW))).toBe(true);
    expect(hasBlockingIssues(validatePredictionDraft({ ...baseDraft(), maxStakePerUser: 5 }, NOW))).toBe(true);
    expect(hasBlockingIssues(validatePredictionDraft({ ...baseDraft(), rakeBps: 2_001 }, NOW))).toBe(true);
    // Teto zero é "sem limite" e deve passar.
    expect(validatePredictionDraft({ ...baseDraft(), maxStakePerUser: 0 }, NOW)).toEqual([]);
    // Rake alto é apenas aviso.
    const warn = validatePredictionDraft({ ...baseDraft(), rakeBps: 1_500 }, NOW);
    expect(hasBlockingIssues(warn)).toBe(false);
    expect(warn).toHaveLength(1);
  });

  it("valida janela temporal e ordem de apuração", () => {
    expect(hasBlockingIssues(validatePredictionDraft({ ...baseDraft(), locksAt: "não-é-data" }, NOW))).toBe(true);
    expect(hasBlockingIssues(validatePredictionDraft({ ...baseDraft(), locksAt: new Date(NOW - HOUR).toISOString() }, NOW))).toBe(true);
    expect(hasBlockingIssues(validatePredictionDraft({ ...baseDraft(), locksAt: new Date(NOW + 60_000).toISOString() }, NOW))).toBe(true);
    expect(
      hasBlockingIssues(
        validatePredictionDraft(
          { ...baseDraft(), resolvesAt: new Date(NOW + 2 * HOUR).toISOString() },
          NOW,
        ),
      ),
    ).toBe(true);
    // Janela muito longa é só aviso.
    const longWindow = validatePredictionDraft(
      {
        ...baseDraft(),
        locksAt: new Date(NOW + 90 * 24 * HOUR).toISOString(),
        resolvesAt: null,
      },
      NOW,
    );
    expect(hasBlockingIssues(longWindow)).toBe(false);
  });

  it("normaliza texto sem alterar a semântica", () => {
    const normalized = normalizeDraft({
      ...baseDraft(),
      title: "  Vamos bater a meta?  ",
      description: "   ",
      options: [" Sim ", "", "Não"],
    });
    expect(normalized.title).toBe("Vamos bater a meta?");
    expect(normalized.description).toBeNull();
    expect(normalized.options).toEqual(["Sim", "Não"]);
  });
});

describe("predictionAdmin — máquina de estados", () => {
  const view = (over: Partial<PredictionStateView> = {}): PredictionStateView => ({
    status: "open",
    locksAt: new Date(NOW + HOUR).toISOString(),
    optionCount: 2,
    totalPool: 100,
    ...over,
  });

  it("estado terminal recusa qualquer ação", () => {
    for (const status of ["settled", "voided"] as PredictionAdminStatus[]) {
      for (const action of ["publish", "lock", "settle", "void"] as PredictionAdminAction[]) {
        expect(canPerform(action, view({ status }), NOW)).toBe(false);
      }
    }
  });

  it("publicar exige rascunho com opções e janela futura", () => {
    expect(canPerform("publish", view({ status: "draft" }), NOW)).toBe(true);
    expect(canPerform("publish", view({ status: "draft", optionCount: 1 }), NOW)).toBe(false);
    expect(canPerform("publish", view({ status: "draft", locksAt: new Date(NOW - HOUR).toISOString() }), NOW)).toBe(false);
    expect(canPerform("publish", view({ status: "open" }), NOW)).toBe(false);
  });

  it("travar só vale para mercado aberto; apurar exige travado ou vencido", () => {
    expect(canPerform("lock", view(), NOW)).toBe(true);
    expect(canPerform("lock", view({ status: "locked" }), NOW)).toBe(false);
    expect(canPerform("settle", view(), NOW)).toBe(false);
    expect(canPerform("settle", view({ locksAt: new Date(NOW - HOUR).toISOString() }), NOW)).toBe(true);
    expect(canPerform("settle", view({ status: "locked" }), NOW)).toBe(true);
    expect(canPerform("void", view({ status: "draft" }), NOW)).toBe(true);
  });

  it("descreve o impacto econômico das ações", () => {
    expect(describeAction("void", view({ totalPool: 250 }))).toContain("250");
    expect(describeAction("settle", view({ totalPool: 0 }))).toContain("sem movimentar");
  });
});

describe("predictionAdmin — simulação massiva (700 cenários)", () => {
  it("mantém contagem exata, ações coerentes e detecção de gaps operacionais", () => {
    const statuses: PredictionAdminStatus[] = ["draft", "open", "locked", "settled", "voided"];
    let scenarios = 0;

    for (let seed = 1; seed <= 700; seed += 1) {
      const rnd = makeRandom(seed);
      const count = 1 + Math.floor(rnd() * 30);
      const markets: PredictionStateView[] = [];

      for (let i = 0; i < count; i += 1) {
        const status = statuses[Math.floor(rnd() * statuses.length)];
        const offset = Math.floor((rnd() - 0.5) * 96) * HOUR;
        markets.push({
          status,
          locksAt: rnd() < 0.05 ? "data-corrompida" : new Date(NOW + offset).toISOString(),
          optionCount: 1 + Math.floor(rnd() * 5),
          totalPool: Math.floor(rnd() * 5_000),
        });
      }

      const overview = summarizeMarkets(markets, NOW);

      // G4: cada mercado é contabilizado uma única vez.
      expect(
        overview.drafts + overview.open + overview.locked + overview.settled + overview.voided,
      ).toBe(overview.total);
      expect(overview.total).toBe(markets.length);
      expect(overview.lockingSoon + overview.expiredButOpen).toBeLessThanOrEqual(overview.open);
      expect(overview.awaitingSettlement).toBe(overview.locked);

      // Moedas em risco = pote de tudo que ainda não foi apurado nem anulado.
      const expectedAtRisk = markets
        .filter((m) => m.status === "open" || m.status === "locked")
        .reduce((acc, m) => acc + m.totalPool, 0);
      expect(overview.coinsAtRisk).toBe(expectedAtRisk);

      for (const market of markets) {
        const terminal = market.status === "settled" || market.status === "voided";
        const actions: PredictionAdminAction[] = ["publish", "lock", "settle", "void"];
        const allowed = actions.filter((a) => canPerform(a, market, NOW));

        // G1
        if (terminal) expect(allowed).toEqual([]);

        // G2: nunca apurar um mercado aberto que ainda aceita aportes.
        const locksAt = new Date(market.locksAt).getTime();
        const stillAccepting =
          market.status === "open" && Number.isFinite(locksAt) && locksAt > NOW;
        if (stillAccepting) expect(allowed).not.toContain("settle");

        // G3: publicar exige ao menos 2 opções.
        if (market.optionCount < 2) expect(allowed).not.toContain("publish");

        // Travar e publicar são mutuamente exclusivos.
        expect(allowed.includes("publish") && allowed.includes("lock")).toBe(false);

        // Toda ação permitida tem descrição não vazia (UI nunca fica muda).
        for (const action of allowed) {
          expect(describeAction(action, market).length).toBeGreaterThan(0);
        }
      }

      // Rascunhos aleatórios: validação é determinística e nunca lança.
      const draft: PredictionDraft = {
        title: "q".repeat(Math.floor(rnd() * 150)),
        description: rnd() < 0.2 ? "d".repeat(Math.floor(rnd() * 900)) : null,
        options: Array.from({ length: Math.floor(rnd() * 8) }, (_, i) => `op${i}`),
        minStake: Math.floor(rnd() * 50) - 5,
        maxStakePerUser: Math.floor(rnd() * 1_000) - 50,
        rakeBps: Math.floor(rnd() * 2_500),
        locksAt: new Date(NOW + Math.floor((rnd() - 0.3) * 200) * HOUR).toISOString(),
        resolvesAt: rnd() < 0.5 ? new Date(NOW + Math.floor(rnd() * 300) * HOUR).toISOString() : null,
      };
      const issues = validatePredictionDraft(draft, NOW);
      expect(validatePredictionDraft(draft, NOW)).toEqual(issues);
      if (!hasBlockingIssues(issues)) {
        // Um rascunho aprovado sempre satisfaz as invariantes duras.
        const options = draft.options.map((o) => o.trim()).filter(Boolean);
        expect(options.length).toBeGreaterThanOrEqual(2);
        expect(options.length).toBeLessThanOrEqual(6);
        expect(new Set(options).size).toBe(options.length);
        expect(draft.minStake).toBeGreaterThanOrEqual(1);
        expect(draft.rakeBps).toBeLessThanOrEqual(2_000);
        expect(new Date(draft.locksAt).getTime() - NOW).toBeGreaterThanOrEqual(15 * 60_000);
      }

      scenarios += 1;
    }

    expect(scenarios).toBe(700);
  });
});