import { describe, expect, it } from "vitest";
import {
  aggregateMonthlyExposure,
  budgetUsage,
  monthKeyOf,
  monthLabel,
  questionWorstCase,
} from "@/lib/wagerMonthlyExposure";
import type { AdminWagerQuestion } from "@/services/wagerAdminService";

function q(overrides: Partial<AdminWagerQuestion> = {}): AdminWagerQuestion {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    question: "Pergunta",
    options: [
      { id: "A", label: "A" },
      { id: "B", label: "B" },
    ],
    correctOption: "A",
    explanation: null,
    difficulty: "medium",
    multiplier: 2,
    maxStake: 100,
    scheduledDate: "2026-03-10",
    isActive: true,
    totalEntries: 0,
    correctEntries: 0,
    totalStaked: 0,
    coinsDelta: 0,
    ...overrides,
  };
}

describe("monthKeyOf", () => {
  it("extrai o mês de uma data ISO", () => {
    expect(monthKeyOf("2026-03-10")).toBe("2026-03");
  });
  it("rejeita datas inválidas ou vazias", () => {
    expect(monthKeyOf("")).toBeNull();
    expect(monthKeyOf(null)).toBeNull();
    expect(monthKeyOf("10/03/2026")).toBeNull();
    expect(monthKeyOf("2026-13-01")).toBeNull();
    expect(monthKeyOf("2026-00-01")).toBeNull();
  });
  it("aceita timestamp completo", () => {
    expect(monthKeyOf("2026-12-31T23:59:59Z")).toBe("2026-12");
  });
});

describe("monthLabel", () => {
  it("gera rótulo pt-BR", () => {
    expect(monthLabel("2026-03")).toMatch(/2026/);
  });
  it("devolve a chave quando inválida", () => {
    expect(monthLabel("invalido")).toBe("invalido");
  });
});

describe("questionWorstCase", () => {
  it("usa multiplicador líquido", () => {
    expect(questionWorstCase({ maxStake: 100, multiplier: 2, isActive: true }, 10)).toBe(1000);
  });
  it("zera perguntas inativas", () => {
    expect(questionWorstCase({ maxStake: 100, multiplier: 3, isActive: false }, 10)).toBe(0);
  });
  it("nunca fica negativo com multiplicador < 1", () => {
    expect(questionWorstCase({ maxStake: 100, multiplier: 0.5, isActive: true }, 10)).toBe(0);
  });
  it("trata participantes negativos como zero", () => {
    expect(questionWorstCase({ maxStake: 100, multiplier: 2, isActive: true }, -5)).toBe(0);
  });
  it("arredonda multiplicadores fracionários", () => {
    expect(questionWorstCase({ maxStake: 50, multiplier: 1.5, isActive: true }, 3)).toBe(75);
  });
  it("ignora valores não numéricos", () => {
    expect(
      questionWorstCase(
        { maxStake: Number.NaN, multiplier: Number.NaN, isActive: true },
        10,
      ),
    ).toBe(0);
  });
});

describe("aggregateMonthlyExposure", () => {
  it("retorna vazio para entrada nula", () => {
    const s = aggregateMonthlyExposure(null, 10);
    expect(s.months).toEqual([]);
    expect(s.peakMonth).toBeNull();
    expect(s.totals.worstCase).toBe(0);
    expect(s.totals.accuracy).toBeNull();
  });

  it("agrupa por mês e ordena cronologicamente", () => {
    const s = aggregateMonthlyExposure(
      [q({ scheduledDate: "2026-04-02" }), q({ scheduledDate: "2026-03-15" })],
      10,
    );
    expect(s.months.map((m) => m.month)).toEqual(["2026-03", "2026-04"]);
  });

  it("soma pior caso apenas de perguntas ativas", () => {
    const s = aggregateMonthlyExposure(
      [q(), q({ isActive: false, maxStake: 999, multiplier: 5 })],
      10,
    );
    expect(s.months[0].worstCase).toBe(1000);
    expect(s.months[0].activeQuestions).toBe(1);
    expect(s.months[0].questions).toBe(2);
  });

  it("calcula acurácia observada", () => {
    const s = aggregateMonthlyExposure(
      [q({ totalEntries: 8, correctEntries: 2 }), q({ totalEntries: 2, correctEntries: 3 })],
      1,
    );
    expect(s.months[0].accuracy).toBeCloseTo(0.5);
  });

  it("mantém acurácia nula sem apostas", () => {
    const s = aggregateMonthlyExposure([q()], 1);
    expect(s.months[0].accuracy).toBeNull();
  });

  it("soma saldo liquidado negativo", () => {
    const s = aggregateMonthlyExposure([q({ coinsDelta: -400 }), q({ coinsDelta: 100 })], 0);
    expect(s.months[0].settled).toBe(-300);
  });

  it("ignora perguntas com data inválida", () => {
    const s = aggregateMonthlyExposure([q({ scheduledDate: "sem-data" }), q()], 1);
    expect(s.months).toHaveLength(1);
    expect(s.totals.questions).toBe(1);
  });

  it("identifica o mês de pico", () => {
    const s = aggregateMonthlyExposure(
      [
        q({ scheduledDate: "2026-03-01", maxStake: 100 }),
        q({ scheduledDate: "2026-04-01", maxStake: 500 }),
      ],
      10,
    );
    expect(s.peakMonth?.month).toBe("2026-04");
  });

  it("consolida totais entre meses", () => {
    const s = aggregateMonthlyExposure(
      [q({ scheduledDate: "2026-03-01" }), q({ scheduledDate: "2026-04-01" })],
      10,
    );
    expect(s.totals.worstCase).toBe(2000);
    expect(s.totals.questions).toBe(2);
  });

  it("sanitiza métricas negativas vindas do banco", () => {
    const s = aggregateMonthlyExposure(
      [q({ totalStaked: -50, totalEntries: -3, correctEntries: -1 })],
      1,
    );
    expect(s.months[0].staked).toBe(0);
    expect(s.months[0].entries).toBe(0);
    expect(s.months[0].accuracy).toBeNull();
  });

  it("tolera itens nulos no array", () => {
    const s = aggregateMonthlyExposure(
      [null as unknown as AdminWagerQuestion, q()],
      1,
    );
    expect(s.totals.questions).toBe(1);
  });

  it("é determinístico entre execuções", () => {
    const input = [q({ id: "a" }), q({ id: "b", scheduledDate: "2026-05-01" })];
    expect(aggregateMonthlyExposure(input, 7)).toEqual(aggregateMonthlyExposure(input, 7));
  });
});

describe("budgetUsage", () => {
  it("retorna null sem orçamento", () => {
    expect(budgetUsage(1000, 0)).toBeNull();
    expect(budgetUsage(1000, -5)).toBeNull();
  });
  it("calcula fração acima de 100%", () => {
    expect(budgetUsage(1500, 1000)).toBeCloseTo(1.5);
  });
  it("nunca retorna negativo", () => {
    expect(budgetUsage(-500, 1000)).toBe(0);
  });
});
