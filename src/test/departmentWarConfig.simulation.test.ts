/**
 * Simulacao massiva do motor de configuracao da Guerra de Departamentos.
 *
 * Objetivo: provar, antes de qualquer gestor tocar na tela, que nenhuma
 * combinacao de entradas (inclusive hostis) produz configuracao que estoure a
 * economia, quebre invariantes ou lance excecao.
 */

import { describe, expect, it } from "vitest";
import {
  WAR_LIMITS,
  emptyWarDraft,
  normalizeWarDraft,
  projectWarCost,
  reviewWarDraft,
  type WarConfigDraft,
} from "@/lib/departmentWarConfig";

/** PRNG deterministico (mulberry32) — falhas sao sempre reproduziveis. */
function makeRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HOSTILE_VALUES: unknown[] = [
  undefined,
  null,
  NaN,
  Infinity,
  -Infinity,
  -1,
  0,
  "abc",
  "",
  {},
  [],
  1e12,
  -1e12,
];

function randomDraft(rng: () => number): Partial<WarConfigDraft> {
  const deptCount = Math.floor(rng() * 8);
  const metricCount = Math.floor(rng() * 6);
  const start = Date.now() + Math.floor((rng() - 0.5) * 1e10);
  const end = start + Math.floor(rng() * 1e10) - 1e9;
  return {
    title: rng() < 0.15 ? "" : `Guerra ${Math.floor(rng() * 1000)}`,
    description: rng() < 0.5 ? "x".repeat(Math.floor(rng() * 2000)) : "",
    starts_at: new Date(start).toISOString(),
    ends_at: new Date(end).toISOString(),
    fairness_alpha: (rng() - 0.2) * 1.8,
    per_user_cap: Math.floor((rng() - 0.2) * 5000),
    participation_bonus: (rng() - 0.2) * 1.8,
    coins_pool: Math.floor((rng() - 0.1) * 2_000_000),
    xp_pool: Math.floor((rng() - 0.1) * 2_000_000),
    placement_shares: Array.from({ length: Math.floor(rng() * 14) }, () => (rng() - 0.3) * 1.5),
    per_member_coins_cap: Math.floor((rng() - 0.3) * 5000),
    metrics: Array.from({ length: metricCount }, (_, i) => ({
      // Colisao proposital de chaves para exercitar a deduplicacao.
      metric_key: rng() < 0.3 ? "tarefa_concluida" : `metrica_${i % 3}`,
      label: `Metrica ${i}`,
      weight: (rng() - 0.2) * 20,
    })),
    departments: Array.from({ length: deptCount }, (_, i) => ({
      department_id: rng() < 0.25 ? "dept-fixo" : `dept-${i}`,
      name: `Departamento ${i}`,
      headcount: Math.floor((rng() - 0.2) * 200),
    })),
  };
}

describe("departmentWarConfig — normalizacao", () => {
  it("nunca lanca e sempre devolve estrutura valida em 600 cenarios aleatorios", () => {
    const rng = makeRng(20260727);
    for (let i = 0; i < 600; i += 1) {
      const draft = randomDraft(rng);
      const normalized = normalizeWarDraft(draft);

      expect(normalized.fairness_alpha).toBeGreaterThanOrEqual(0);
      expect(normalized.fairness_alpha).toBeLessThanOrEqual(1);
      expect(normalized.participation_bonus).toBeGreaterThanOrEqual(0);
      expect(normalized.participation_bonus).toBeLessThanOrEqual(1);
      expect(normalized.coins_pool).toBeGreaterThanOrEqual(0);
      expect(normalized.coins_pool).toBeLessThanOrEqual(WAR_LIMITS.MAX_COINS_POOL);
      expect(normalized.xp_pool).toBeGreaterThanOrEqual(0);
      expect(normalized.xp_pool).toBeLessThanOrEqual(WAR_LIMITS.MAX_XP_POOL);
      expect(normalized.per_user_cap).toBeGreaterThanOrEqual(0);
      expect(normalized.per_member_coins_cap).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(normalized.coins_pool)).toBe(true);
      expect(Number.isInteger(normalized.xp_pool)).toBe(true);

      expect(normalized.metrics.length).toBeLessThanOrEqual(WAR_LIMITS.MAX_METRICS);
      expect(normalized.departments.length).toBeLessThanOrEqual(WAR_LIMITS.MAX_DEPARTMENTS);
      expect(normalized.placement_shares.length).toBeLessThanOrEqual(WAR_LIMITS.MAX_PLACEMENTS);
      expect(normalized.title.length).toBeLessThanOrEqual(WAR_LIMITS.TITLE_MAX);
      expect(normalized.description.length).toBeLessThanOrEqual(WAR_LIMITS.DESCRIPTION_MAX);

      for (const share of normalized.placement_shares) {
        expect(share).toBeGreaterThanOrEqual(0);
        expect(share).toBeLessThanOrEqual(1);
      }
      for (const metric of normalized.metrics) {
        expect(metric.weight).toBeGreaterThanOrEqual(0);
        expect(metric.label.length).toBeGreaterThan(0);
      }
      for (const dept of normalized.departments) {
        expect(dept.headcount).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(dept.headcount)).toBe(true);
      }
    }
  });

  it("deduplica metricas e departamentos por chave", () => {
    const normalized = normalizeWarDraft({
      metrics: [
        { metric_key: "  Tarefa  ", label: "A", weight: 2 },
        { metric_key: "tarefa", label: "B", weight: 5 },
      ],
      departments: [
        { department_id: "d1", name: "Um", headcount: 10 },
        { department_id: "d1", name: "Duplicado", headcount: 99 },
      ],
    });
    expect(normalized.metrics).toHaveLength(1);
    expect(normalized.metrics[0].metric_key).toBe("tarefa");
    expect(normalized.metrics[0].weight).toBe(2);
    expect(normalized.departments).toHaveLength(1);
    expect(normalized.departments[0].headcount).toBe(10);
  });

  it("e idempotente: normalizar duas vezes nao muda nada", () => {
    const rng = makeRng(7);
    for (let i = 0; i < 200; i += 1) {
      const once = normalizeWarDraft(randomDraft(rng));
      const twice = normalizeWarDraft(once);
      expect(twice).toEqual(once);
    }
  });

  it("resiste a valores hostis em todos os campos numericos", () => {
    const numericFields = [
      "fairness_alpha",
      "per_user_cap",
      "participation_bonus",
      "coins_pool",
      "xp_pool",
      "per_member_coins_cap",
    ] as const;
    for (const field of numericFields) {
      for (const value of HOSTILE_VALUES) {
        const normalized = normalizeWarDraft({ [field]: value } as Partial<WarConfigDraft>);
        const result = normalized[field] as number;
        expect(Number.isFinite(result)).toBe(true);
        expect(result).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("aceita entradas totalmente ausentes", () => {
    expect(() => normalizeWarDraft(null)).not.toThrow();
    expect(() => normalizeWarDraft(undefined)).not.toThrow();
    expect(() => normalizeWarDraft({} as Partial<WarConfigDraft>)).not.toThrow();
  });
});

describe("departmentWarConfig — projecao economica", () => {
  it("nunca projeta credito acima do pool em 600 cenarios", () => {
    const rng = makeRng(31337);
    for (let i = 0; i < 600; i += 1) {
      const normalized = normalizeWarDraft(randomDraft(rng));
      const projection = projectWarCost(normalized);

      expect(projection.coins_worst_case).toBeGreaterThanOrEqual(0);
      expect(projection.xp_worst_case).toBeGreaterThanOrEqual(0);
      expect(projection.coins_worst_case).toBeLessThanOrEqual(normalized.coins_pool);
      expect(projection.xp_worst_case).toBeLessThanOrEqual(normalized.xp_pool);
      expect(Number.isInteger(projection.coins_worst_case)).toBe(true);
      expect(Number.isInteger(projection.xp_worst_case)).toBe(true);
      expect(projection.coins_returned).toBeGreaterThanOrEqual(0);
      expect(projection.xp_returned).toBeGreaterThanOrEqual(0);
      expect(projection.awarded_departments).toBeLessThanOrEqual(
        normalized.departments.length,
      );

      // Conservacao: creditado + devolvido nunca ultrapassa o pool.
      expect(projection.coins_worst_case + projection.coins_returned).toBeLessThanOrEqual(
        normalized.coins_pool,
      );
      expect(projection.xp_worst_case + projection.xp_returned).toBeLessThanOrEqual(
        normalized.xp_pool,
      );
    }
  });

  it("respeita o teto por membro", () => {
    const rng = makeRng(99);
    for (let i = 0; i < 200; i += 1) {
      const cap = Math.floor(rng() * 500) + 1;
      const normalized = normalizeWarDraft({
        ...randomDraft(rng),
        coins_pool: 500_000,
        per_member_coins_cap: cap,
        departments: [
          { department_id: "a", name: "A", headcount: 10 },
          { department_id: "b", name: "B", headcount: 20 },
          { department_id: "c", name: "C", headcount: 30 },
        ],
      });
      const projection = projectWarCost(normalized);
      expect(projection.max_coins_per_member).toBeLessThanOrEqual(cap);
    }
  });

  it("e monotonica: aumentar o pool nunca reduz o custo projetado", () => {
    const base = normalizeWarDraft({
      ...emptyWarDraft(),
      departments: [
        { department_id: "a", name: "A", headcount: 8 },
        { department_id: "b", name: "B", headcount: 12 },
        { department_id: "c", name: "C", headcount: 5 },
      ],
    });
    let previous = -1;
    for (let pool = 0; pool <= 100_000; pool += 2_500) {
      const projection = projectWarCost({ ...base, coins_pool: pool });
      expect(projection.coins_worst_case).toBeGreaterThanOrEqual(previous);
      previous = projection.coins_worst_case;
    }
  });

  it("pool zero nunca credita nada", () => {
    const draft = normalizeWarDraft({
      ...emptyWarDraft(),
      coins_pool: 0,
      xp_pool: 0,
      departments: [
        { department_id: "a", name: "A", headcount: 50 },
        { department_id: "b", name: "B", headcount: 50 },
      ],
    });
    const projection = projectWarCost(draft);
    expect(projection.coins_worst_case).toBe(0);
    expect(projection.xp_worst_case).toBe(0);
  });

  it("sem departamentos nao ha premiacao possivel", () => {
    const projection = projectWarCost(
      normalizeWarDraft({ ...emptyWarDraft(), coins_pool: 100_000, departments: [] }),
    );
    expect(projection.awarded_departments).toBe(0);
    expect(projection.coins_worst_case).toBe(0);
    expect(projection.reached_members).toBe(0);
  });
});

describe("departmentWarConfig — revisao", () => {
  it("nunca lanca e mantem coerencia valid/issues em 600 cenarios", () => {
    const rng = makeRng(2026);
    let validCount = 0;
    for (let i = 0; i < 600; i += 1) {
      const review = reviewWarDraft(randomDraft(rng));
      const hasError = review.issues.some((issue) => issue.level === "error");
      expect(review.valid).toBe(!hasError);
      for (const issue of review.issues) {
        expect(issue.message.length).toBeGreaterThan(0);
        expect(issue.field.length).toBeGreaterThan(0);
      }
      if (review.valid) validCount += 1;
    }
    // A amostra precisa exercitar os dois lados da fronteira.
    expect(validCount).toBeGreaterThan(0);
    expect(validCount).toBeLessThan(600);
  });

  it("rejeita rascunho vazio", () => {
    const review = reviewWarDraft(emptyWarDraft());
    expect(review.valid).toBe(false);
    expect(review.issues.some((i) => i.field === "title" && i.level === "error")).toBe(true);
    expect(review.issues.some((i) => i.field === "departments" && i.level === "error")).toBe(
      true,
    );
  });

  it("aprova um rascunho bem formado", () => {
    const now = Date.now();
    const review = reviewWarDraft({
      ...emptyWarDraft(new Date(now)),
      title: "Guerra de Outubro",
      starts_at: new Date(now).toISOString(),
      ends_at: new Date(now + 7 * 24 * 3600 * 1000).toISOString(),
      coins_pool: 10_000,
      xp_pool: 5_000,
      per_member_coins_cap: 300,
      metrics: [{ metric_key: "tarefa_concluida", label: "Tarefas", weight: 1 }],
      departments: [
        { department_id: "a", name: "Comercial", headcount: 12 },
        { department_id: "b", name: "Logística", headcount: 30 },
        { department_id: "c", name: "TI", headcount: 6 },
      ],
    });
    expect(review.valid).toBe(true);
    expect(review.projection.coins_worst_case).toBeLessThanOrEqual(10_000);
  });

  it("bloqueia término anterior ao início e duracao insuficiente", () => {
    const now = Date.now();
    const invertido = reviewWarDraft({
      title: "Teste",
      starts_at: new Date(now).toISOString(),
      ends_at: new Date(now - 1000).toISOString(),
      departments: [
        { department_id: "a", name: "A", headcount: 5 },
        { department_id: "b", name: "B", headcount: 5 },
      ],
    });
    expect(invertido.valid).toBe(false);

    const curto = reviewWarDraft({
      title: "Teste",
      starts_at: new Date(now).toISOString(),
      ends_at: new Date(now + 60_000).toISOString(),
      departments: [
        { department_id: "a", name: "A", headcount: 5 },
        { department_id: "b", name: "B", headcount: 5 },
      ],
    });
    expect(curto.valid).toBe(false);
  });

  it("bloqueia chave de metrica invalida", () => {
    const review = reviewWarDraft({
      title: "Guerra",
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 86_400_000).toISOString(),
      metrics: [{ metric_key: "Métrica Inválida!", label: "x", weight: 1 }],
      departments: [
        { department_id: "a", name: "A", headcount: 5 },
        { department_id: "b", name: "B", headcount: 5 },
      ],
    });
    expect(review.valid).toBe(false);
    expect(review.issues.some((i) => i.field === "metrics" && i.level === "error")).toBe(true);
  });

  it("alerta (sem bloquear) sobre custo elevado", () => {
    const review = reviewWarDraft({
      title: "Guerra Cara",
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 86_400_000 * 10).toISOString(),
      coins_pool: WAR_LIMITS.MAX_COINS_POOL,
      placement_shares: [1],
      departments: [
        { department_id: "a", name: "A", headcount: 10 },
        { department_id: "b", name: "B", headcount: 10 },
      ],
    });
    expect(review.valid).toBe(true);
    expect(review.issues.some((i) => i.level === "warning")).toBe(true);
  });

  it("e deterministico: mesma entrada, mesmo parecer", () => {
    const rng = makeRng(4242);
    for (let i = 0; i < 150; i += 1) {
      const draft = randomDraft(rng);
      expect(reviewWarDraft(draft)).toEqual(reviewWarDraft(draft));
    }
  });
});
